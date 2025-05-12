import mongoose from 'mongoose';

const OptionCategorySchema = new mongoose.Schema({
  brand: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand', required: true },
  name: { type: String, trim: true, required: true },
  inputType: { type: String, enum: ['single', 'multiple'], required: true },
  options: [{
    refOption: { type: mongoose.Schema.Types.ObjectId, ref: 'Option' },
    order: { type: Number, default: 0 }
  }]
});

OptionCategorySchema.index({ brand: 1 });

export default mongoose.model('OptionCategory', OptionCategorySchema);
