import express from 'express';
import MaintenanceTicket from '../models/MaintenanceTicket.js';
import RentalOrder from '../models/RentalOrder.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';

const router = express.Router();

// GET /api/maintenance
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { role, id } = req.user;
    let query = {};

    if (role === 'CUSTOMER') {
      query = { customer: id };
    } else if (role === 'VENDOR') {
      query = { vendor: id };
    }

    const tickets = await MaintenanceTicket.find(query).sort({ createdAt: -1 });
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/maintenance (Customer creates repair ticket)
router.post('/', authMiddleware, requireRole('CUSTOMER'), async (req, res) => {
  try {
    const { orderId, issueType, description, priority = 'MEDIUM', photos } = req.body;

    if (!orderId || !issueType || !description) {
      return res.status(400).json({ message: 'Order ID, issue type, and description are required.' });
    }

    const order = await RentalOrder.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Rental order not found.' });

    if (order.customer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const ticketCode = `TKT-${Math.floor(1000 + Math.random() * 9000)}`;

    const ticket = await MaintenanceTicket.create({
      ticketCode,
      order: order._id,
      customer: req.user.id,
      customerName: req.user.name,
      customerPhone: req.user.phone,
      vendor: order.vendor,
      product: order.product,
      productTitle: order.productTitle,
      issueType,
      description,
      priority,
      status: 'PENDING',
      photos: photos || []
    });

    res.status(201).json(ticket);
  } catch (err) {
    console.error('[Create Maintenance Ticket Error]', err);
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/maintenance/:id (Vendor/Admin updates ticket status & assigns tech)
router.patch('/:id', authMiddleware, requireRole(['VENDOR', 'ADMIN']), async (req, res) => {
  try {
    const { status, technicianName, technicianPhone, resolutionNotes, scheduledAppointment } = req.body;
    const ticket = await MaintenanceTicket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    if (req.user.role === 'VENDOR' && ticket.vendor.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    if (status) ticket.status = status;
    if (technicianName) ticket.technicianName = technicianName;
    if (technicianPhone) ticket.technicianPhone = technicianPhone;
    if (resolutionNotes) ticket.resolutionNotes = resolutionNotes;
    if (scheduledAppointment) ticket.scheduledAppointment = scheduledAppointment;
    if (status === 'RESOLVED') ticket.resolvedAt = new Date();

    await ticket.save();
    res.json(ticket);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
