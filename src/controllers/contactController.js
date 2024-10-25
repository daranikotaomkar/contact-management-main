
import { Contact } from '../models/Contact.js';
import { parseCSV, parseExcel, generateCSV } from '../utils/fileParser.js';
import { Op } from 'sequelize';
import sequelize from '../config/database.js';

export const createContact = async (req, res) => {
  try {
    const contact = await Contact.create({
      ...req.body,
      user_id: req.user.id
    });

    res.status(201).json(contact);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create contact' });
  }
};

export const getContacts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sort = 'created_at',
      order = 'DESC',
      search,
      timezone,
      startDate,
      endDate
    } = req.query;

    const offset = (page - 1) * limit;
    
    let where = {
      user_id: req.user.id,
      is_deleted: false
    };

    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } }
      ];
    }

    if (timezone) {
      where.timezone = timezone;
    }

    if (startDate && endDate) {
      where.created_at = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    const contacts = await Contact.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      order: [[sort, order]],
    });

    res.json({
      contacts: contacts.rows,
      total: contacts.count,
      pages: Math.ceil(contacts.count / limit)
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve contacts' });
  }
};

export const updateContact = async (req, res) => {
  try {
    const { id } = req.params;
    const contact = await Contact.findOne({
      where: { id, user_id: req.user.id }
    });

    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    await contact.update(req.body);
    res.json(contact);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update contact' });
  }
};

export const deleteContact = async (req, res) => {
  try {
    const { id } = req.params;
    const contact = await Contact.findOne({
      where: { id, user_id: req.user.id }
    });

    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    await contact.update({ is_deleted: true });
    res.json({ message: 'Contact deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete contact' });
  }
};

export const uploadContacts = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const file = req.file;
    const fileExtension = file.originalname.split('.').pop().toLowerCase();
    
    let contacts;
    if (fileExtension === 'csv') {
      contacts = await parseCSV(file.buffer);
    } else if (['xlsx', 'xls'].includes(fileExtension)) {
      contacts = await parseExcel(file.buffer);
    } else {
      throw new Error('Unsupported file format');
    }

    const validatedContacts = contacts.map(contact => ({
      ...contact,
      user_id: req.user.id
    }));

    await Contact.bulkCreate(validatedContacts, {
      transaction,
      validate: true
    });

    await transaction.commit();
    res.json({ message: 'Contacts imported successfully' });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ error: 'Failed to import contacts' });
  }
};

export const downloadContacts = async (req, res) => {
  try {
    const contacts = await Contact.findAll({
      where: { user_id: req.user.id, is_deleted: false }
    });

    const csv = await generateCSV(contacts);
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=contacts.csv');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: 'Failed to download contacts' });
  }
};