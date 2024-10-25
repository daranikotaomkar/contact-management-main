import * as yup from 'yup';

const userSchema = yup.object({
  email: yup.string().email().required(),
  password: yup.string().min(8).required(),
});

const contactSchema = yup.object({
  name: yup.string().required(),
  email: yup.string().email().required(),
  phone_number: yup.string().required(),
  address: yup.string(),
  timezone: yup.string().default('UTC'),
});

export const validateUser = async (req, res, next) => {
  try {
    await userSchema.validate(req.body);
    next();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const validateContact = async (req, res, next) => {
  try {
    await contactSchema.validate(req.body);
    next();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};