import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  tenureMonths: {
    type: Number,
    required: true,
    enum: [3, 6, 9, 12],
    default: 6
  },
  monthlyRent: {
    type: Number,
    required: true
  },
  deposit: {
    type: Number,
    required: true
  },
  deliveryCity: {
    type: String,
    default: 'Bengaluru'
  },
  deliveryDate: {
    type: String,
    default: ''
  }
});

const cartSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    items: [cartItemSchema]
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        delete ret.__v;
        return ret;
      }
    },
    toObject: { virtuals: true }
  }
);

const Cart = mongoose.model('Cart', cartSchema);
export default Cart;
