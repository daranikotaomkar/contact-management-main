
import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import { DateTime } from 'luxon';

class Contact extends Model {
  getLocalDateTime(timezone) {
    return DateTime
      .fromJSDate(this.created_at)
      .setZone(timezone)
      .toFormat('yyyy-MM-dd HH:mm:ss');
  }
}

Contact.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isEmail: true
    }
  },
  phone_number: {
    type: DataTypes.STRING,
    allowNull: false
  },
  address: {
    type: DataTypes.TEXT
  },
  timezone: {
    type: DataTypes.STRING,
    defaultValue: 'UTC'
  },
  is_deleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  sequelize,
  modelName: 'Contact',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

export default Contact;