import mongoose from 'mongoose';

const OptionCategorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  inputType: { type: String, enum: ['single', 'multiple'], required: true },
  options: [{
    refOption: { type: mongoose.Schema.Types.ObjectId, ref: 'Option' },
    order: { type: Number, default: 0 }
  }]
});

export default mongoose.model('OptionCategory', OptionCategorySchema);
