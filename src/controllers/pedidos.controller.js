import { getConnection } from '../database/connection.js';
import sql from "mssql";

export const getPedidos = async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().query('SELECT * FROM pedidos');
        res.json(result.recordset);
    } catch (error) {
        console.error("Error al obtener pedidos: ", error);
        res.status(500).json({ msg: 'Error al obtener pedidos' });
    }
};

export const getPedido = async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await getConnection();
        const result = await pool.request()
            .input('id', sql.VarChar, id)
            .query('SELECT * FROM pedidos WHERE idPedido = @id');

        if (result.recordset.length === 0) {
            // El idPedido no existe
            return res.status(404).json({ msg: `Pedido con id ${id} no encontrado` });
        }

        // Si existe el idPedido, devolver el pedido
        res.json(result.recordset[0]);
    } catch (error) {
        console.error("Error al obtener el pedido: ", error);
        res.status(500).json({ msg: 'Error al obtener el pedido' });
    }
};

export const createPedido = async (req, res) => {
    try {
        const { idPedido, idCotizacion, idCliente, idMetodoPago, idEstadoEnvio, idEmpleado, fechaEntrega, fechaEmision } = req.body;

        // Validar que todos los campos necesarios están presentes
        if (!idPedido || !idCotizacion || !idCliente || !idMetodoPago || !idEstadoEnvio || !fechaEntrega || !fechaEmision) {
            return res.status(400).json({ msg: 'Todos los campos son obligatorios' });
        }

        const pool = await getConnection();
        await pool.request()
            .input('idPedido', sql.VarChar, idPedido)
            .input('idCotizacion', sql.VarChar, idCotizacion)
            .input('idCliente', sql.VarChar, idCliente)
            .input('idMetodoPago', sql.Int, idMetodoPago)
            .input('idEstadoEnvio', sql.Int, idEstadoEnvio)
            .input('fechaEntrega', sql.DateTime, fechaEntrega)
            .input('fechaEmision', sql.DateTime, fechaEmision)
            .query('INSERT INTO pedidos (idPedido, idCotizacion, idCliente, idMetodoPago, idEstadoEnvio, fechaEntrega, fechaEmision) VALUES (@idPedido, @idCotizacion, @idCliente, @idMetodoPago, @idEstadoEnvio, @fechaEntrega, @fechaEmision)');

        res.status(201).json({ msg: 'Pedido creado exitosamente' });
    } catch (error) {
        console.error("Error al crear el pedido: ", error);
        res.status(500).json({ msg: 'Error al crear el pedido' });
    }
};

export const updatePedido = async (req, res) => {
    try {
        const { id } = req.params;
        const { idCotizacion, idCliente, idMetodoPago, idEstadoEnvio, idEmpleado, fechaEntrega, fechaEmision } = req.body;

        const pool = await getConnection();

        // Construir la consulta SQL dinámicamente
        let query = 'UPDATE pedidos SET idMetodoPago = @idMetodoPago, idEstadoEnvio = @idEstadoEnvio';

        if (idEmpleado) {
            query += ', idEmpleado = @idEmpleado';
        }

        query += ' WHERE idPedido = @id';

        const request = pool.request()
            .input('id', sql.VarChar, id)
            .input('idMetodoPago', sql.Int, idMetodoPago)
            .input('idEstadoEnvio', sql.Int, idEstadoEnvio)
        // Solo añadir el parámetro idEmpleado si no es nulo
        if (idEmpleado) {
            request.input('idEmpleado', sql.VarChar, idEmpleado);
        }

        await request.query(query);

        res.json({ msg: 'Pedido actualizado exitosamente' });
    } catch (error) {
        console.error("Error al actualizar el pedido: ", error);
        res.status(500).json({ msg: 'Error al actualizar el pedido' });
    }
};

export const updateEstadoAListo = async (req, res) => {
    try {
        const { id } = req.params; 

        const pool = await getConnection();


        const query = `
            UPDATE pedidos 
            SET idEstadoEnvio = 4
            WHERE idPedido = @id
        `;

        const request = pool.request()
            .input('id', sql.VarChar, id)

        await request.query(query);
        res.json({ msg: 'Estado de envío del pedido actualizado exitosamente' });
    } catch (error) {
        console.error("Error al actualizar el pedido: ", error);
        res.status(500).json({ msg: 'Error al actualizar el estado de envío del pedido' });
    }
};

export const deletePedido = async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await getConnection();
        await pool.request()
            .input('id', sql.VarChar, id)
            .query('DELETE FROM pedidos WHERE idPedido = @id');

        res.json({ msg: 'Pedido eliminado exitosamente' });
    } catch (error) {
        console.error("Error al eliminar el pedido: ", error);
        res.status(500).json({ msg: 'Error al eliminar el pedido' });
    }
};



// Listar pedidos en tránsito (estado 2)
export const getPedidosTransito = async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request()
            .query('SELECT * FROM pedidos WHERE idEstadoEnvio = 2');
        res.json(result.recordset);
    } catch (error) {
        console.error("Error al obtener pedidos en tránsito: ", error);
        res.status(500).json({ msg: 'Error al obtener pedidos en tránsito' });
    }
};

// Listar pedidos listos para enviar (estado 4)
export const getPedidosEnviar = async (req, res) => {
    try {
        const pool = await getConnection();
        const today = new Date();
        const todayString = today.toISOString().split('T')[0]; 

        console.log("Esta es la fecha de hoy: ", todayString);

        const { idempleado } = req.params; 

        const result = await pool.request()
            .input('todayDate', sql.Date, todayString)
            .input('idEmpleado', sql.NVarChar, idempleado) 
            .query(`
                SELECT * 
                FROM pedidos 
                WHERE idEstadoEnvio IN (2, 4) 
                AND CONVERT(DATE, fechaentrega) = @todayDate
                AND idEmpleado = @idempleado
            `);

        res.json(result.recordset);
    } catch (error) {
        console.error("Error al obtener pedidos listos para enviar: ", error);
        res.status(500).json({ msg: 'Error al obtener pedidos listos para enviar' });
    }
};

export const getLastPedidoId = async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().query('SELECT TOP 1 idPedido FROM pedidos ORDER BY idPedido DESC');
        if (result.recordset.length === 0) {
            return res.status(404).json({ msg: 'No hay pedidos registrados' });
        }
        res.json({ id: result.recordset[0].idPedido });
    } catch (error) {
        console.error("Error al obtener el último ID de pedido: ", error);
        res.status(500).json({ msg: 'Error al obtener el último ID de pedido' });
    }
};

export const updatePedidosAEnTransito = async (req, res) => {
    try {
        const { pedidos, idEmpleado } = req.body;

        const pool = await getConnection();

        for (const pedido of pedidos) {
            await pool.request()
                .input('idPedido', sql.VarChar, pedido.idPedido)
                .query('UPDATE pedidos SET idEstadoEnvio = 2 WHERE idPedido = @idPedido');
        }

        await pool.request()
            .input('idEmpleado', sql.VarChar, idEmpleado)
            .query(`UPDATE transportistas SET estado = 'activo' WHERE idEmpleado = @idEmpleado`);

        res.json({ msg: 'Pedidos actualizados a En tránsito y estado de empleado actualizado exitosamente' });
    } catch (error) {
        console.error("Error al actualizar pedidos a En tránsito y estado de empleado: ", error);
        res.status(500).json({ msg: 'Error al actualizar pedidos a En tránsito y estado de empleado' });
    }
};


export const updatePedidoEntregado = async (req, res) => {
    try {
        const { pedidos, idpedido, idEmpleado } = req.body;

        const pool = await getConnection();

        // Actualiza el estado del pedido específico
        await pool.request()
            .input('idPedido', sql.VarChar, idpedido)
            .query('UPDATE pedidos SET idEstadoEnvio = 3 WHERE idPedido = @idPedido');

        // Verifica cuántos pedidos quedan en el arreglo pedidos
        const remainingPedidos = pedidos.filter(pedido => pedido.idPedido !== idpedido);

        // Si solo queda un pedido, actualiza el estado del transportista
        if (remainingPedidos.length === 0) {
            await pool.request()
                .input('idEmpleado', sql.VarChar, idEmpleado)
                .query(`UPDATE transportistas SET estado = 'inactivo' WHERE idEmpleado = @idEmpleado`);
        }

        res.json({ msg: 'Pedido actualizado a Entregado y estado de empleado actualizado exitosamente' });
    } catch (error) {
        console.error("Error al actualizar pedido a Entregado y estado de empleado: ", error);
        res.status(500).json({ msg: 'Error al actualizar pedido a Entregado y estado de empleado' });
    }
};



