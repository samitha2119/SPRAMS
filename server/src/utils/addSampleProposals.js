require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Project = require('../models/Project');
const ResearchEntry = require('../models/ResearchEntry');

// Minimal valid PDF content
const getSamplePdfBuffer = (title) => {
    return Buffer.from(`%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >> /MediaBox [0 0 595 842] /Contents 4 0 R >> endobj
4 0 obj << /Length 200 >> stream
BT
/F1 18 Tf
72 750 Td
(ACADEMIC PROPOSAL) Tj
/F1 12 Tf
0 -30 Td
(Title: ${title.substring(0, 50)}...) Tj
0 -20 Td
(Repository: University of Vavuniya Academic Archive) Tj
0 -40 Td
(This is a sample academic proposal PDF file. It was automatically) Tj
0 -15 Td
(generated and attached to this record to demonstrate the download) Tj
0 -15 Td
(and attachment functionality of the SPRAMS platform.) Tj
0 -30 Td
(Status: Vetted & Approved) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f
0000000009 00000 n
0000000056 00000 n
0000000111 00000 n
0000000250 00000 n
trailer << /Size 5 /Root 1 0 R >>
startxref
450
%%EOF
`);
};

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB...');

        // 1. Update Projects
        const projects = await Project.find({});
        console.log(`Found ${projects.length} projects to update.`);

        for (const project of projects) {
            // Get a year from academicYear, e.g., "2023/2024" -> "2023"
            const yearMatch = project.academicYear.match(/^(\d{4})/);
            const year = yearMatch ? yearMatch[1] : new Date().getFullYear().toString();

            const pdfDir = path.join(__dirname, '../../uploads', year, 'pdf');
            fs.mkdirSync(pdfDir, { recursive: true });

            const filename = `proposal-${project._id}-${Date.now()}.pdf`;
            const filePath = path.join(pdfDir, filename);

            const pdfBuffer = getSamplePdfBuffer(project.title);
            fs.writeFileSync(filePath, pdfBuffer);

            project.proposalFile = {
                originalName: `Proposal_${project.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
                filePath: filePath, // absolute path as expected by the server
                fileType: 'application/pdf',
                fileSize: pdfBuffer.length
            };

            await project.save();
            console.log(`Updated Project "${project.title}" with sample proposal.`);
        }

        // 2. Update Research
        const researches = await ResearchEntry.find({});
        console.log(`Found ${researches.length} research entries to update.`);

        for (const research of researches) {
            const year = research.year ? research.year.toString() : new Date().getFullYear().toString();

            const pdfDir = path.join(__dirname, '../../uploads', year, 'pdf');
            fs.mkdirSync(pdfDir, { recursive: true });

            const filename = `proposal-${research._id}-${Date.now()}.pdf`;
            const filePath = path.join(pdfDir, filename);

            const pdfBuffer = getSamplePdfBuffer(research.title);
            fs.writeFileSync(filePath, pdfBuffer);

            research.proposalFile = {
                originalName: `Proposal_${research.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
                filePath: filePath, // absolute path as expected by the server
                fileType: 'application/pdf',
                fileSize: pdfBuffer.length
            };

            await research.save();
            console.log(`Updated Research "${research.title}" with sample proposal.`);
        }

        console.log('🎉 Done adding sample proposals!');
        process.exit(0);
    } catch (err) {
        console.error('Error updating entries:', err);
        process.exit(1);
    }
};

run();
