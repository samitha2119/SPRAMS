// Student Schema
const StudentSchema = new mongoose.Schema({
    studentID: { type: String, required: true, unique: true },
    registrationNumber: { type: String, required: true, unique: true },
    name: { type: String, required: true }
}, { timestamps: true });