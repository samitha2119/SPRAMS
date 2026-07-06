require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const User = require('../models/User');
const FormTemplate = require('../models/FormTemplate');

/**
 * Generates a proper minimal valid PDF buffer.
 * Uses raw PDF syntax to create a single-page document.
 */
const makePdf = (title, category, lines = []) => {
    // Each line of text in the PDF body
    const bodyLines = [
        `UNIVERSITY OF VAVUNIYA`,
        `Faculty of Applied Science & Technology`,
        ``,
        title.toUpperCase(),
        `Category: ${category}`,
        ``,
        `─────────────────────────────────────────────────────────`,
        ...lines,
        ``,
        `─────────────────────────────────────────────────────────`,
        `SPRAMS — Student Project and Research Archive System`,
        `Academic Year 2025/2026`,
        `Please fill out all fields and submit via the SPRAMS Portal`,
    ];

    // Build PDF content stream
    let stream = 'BT\n';
    stream += '/F1 16 Tf\n';
    stream += '72 780 Td\n';

    bodyLines.forEach((line, i) => {
        const escapedLine = (line || '')
            .replace(/\\/g, '\\\\')
            .replace(/\(/g, '\\(')
            .replace(/\)/g, '\\)');

        if (i === 0) {
            stream += `(${escapedLine}) Tj\n`;
            stream += '/F1 12 Tf\n';
            stream += '0 -20 Td\n';
        } else if (i === 3) {
            stream += `/F1 14 Tf\n`;
            stream += `(${escapedLine}) Tj\n`;
            stream += `/F1 11 Tf\n`;
            stream += `0 -18 Td\n`;
        } else {
            stream += `(${escapedLine}) Tj\n`;
            stream += `0 -16 Td\n`;
        }
    });

    stream += 'ET';

    const streamLength = Buffer.byteLength(stream, 'utf8');

    const pdf = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj

2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj

3 0 obj
<< /Type /Page /Parent 2 0 R
   /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >>
   /MediaBox [0 0 595 842]
   /Contents 4 0 R >>
endobj

4 0 obj
<< /Length ${streamLength} >>
stream
${stream}
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000266 00000 n 

trailer
<< /Size 5 /Root 1 0 R >>
startxref
400
%%EOF`;

    return Buffer.from(pdf, 'utf8');
};

const TEMPLATES_DATA = [
    {
        name: 'Research Group Registration Form',
        description: 'Use this form to officially register your research group with the Faculty of Applied Science & Technology. Required before undertaking any funded or supervised research.',
        category: 'Registration',
        fileName: 'Research_Group_Registration_Form.pdf',
        lines: [
            `Group Name: ________________________________`,
            `Department: ________________________________`,
            `Academic Year: ____________________________`,
            ``,
            `Group Leader`,
            `  Name: __________________________________`,
            `  Registration No: _______________________`,
            `  Email: __________________________________`,
            ``,
            `Co-Members (up to 5)`,
            `  1. Name: ____________  Reg No: __________`,
            `  2. Name: ____________  Reg No: __________`,
            `  3. Name: ____________  Reg No: __________`,
            `  4. Name: ____________  Reg No: __________`,
            ``,
            `Proposed Supervisor: _____________________`,
            `Research Area / Topic: ___________________`,
            ``,
            `Declaration: I confirm that the above information is accurate.`,
            `Signature: ______________  Date: __________`,
            `Supervisor Approval: _____________________`,
        ],
    },
    {
        name: 'Project Proposal Outline Template',
        description: 'Structured template for writing and submitting final academic project proposals. All project groups must use this template for their initial proposal submission.',
        category: 'Proposal',
        fileName: 'Project_Proposal_Outline.pdf',
        lines: [
            `Project Title: _____________________________`,
            `Academic Year: ____________________________`,
            `Department: ________________________________`,
            `Group Name: ________________________________`,
            `Supervisor: ________________________________`,
            ``,
            `SECTION 1 — INTRODUCTION`,
            `  Background: ____________________________`,
            `  Problem Statement: _____________________`,
            ``,
            `SECTION 2 — OBJECTIVES`,
            `  Objective 1: ___________________________`,
            `  Objective 2: ___________________________`,
            `  Objective 3: ___________________________`,
            ``,
            `SECTION 3 — METHODOLOGY`,
            `  Approach: ______________________________`,
            `  Tools / Technology: ____________________`,
            ``,
            `SECTION 4 — EXPECTED OUTCOMES`,
            `  Deliverable 1: _________________________`,
            `  Deliverable 2: _________________________`,
            ``,
            `SECTION 5 — TIMELINE`,
            `  Phase 1: _______________  Month: _______`,
            `  Phase 2: _______________  Month: _______`,
            `  Phase 3: _______________  Month: _______`,
            ``,
            `Supervisor Signature: ____________________`,
        ],
    },
    {
        name: 'Thesis & Project Book Formatting Guidelines',
        description: 'Comprehensive guide on page layout, margin sizing, citation styles, and font sizes for final thesis and project book submissions.',
        category: 'Guidelines',
        fileName: 'Formatting_Guidelines.pdf',
        lines: [
            `PAGE LAYOUT`,
            `  Paper Size: A4 (210 x 297 mm)`,
            `  Margins: Top 25mm, Bottom 25mm`,
            `          Left 35mm, Right 20mm`,
            `  Line Spacing: 1.5 lines`,
            ``,
            `TYPOGRAPHY`,
            `  Body Font: Times New Roman, 12pt`,
            `  Chapter Headings: Arial Bold, 16pt`,
            `  Section Headings: Arial Bold, 14pt`,
            `  Sub-section: Arial Bold, 12pt`,
            ``,
            `PAGINATION`,
            `  Preliminary pages: lowercase Roman (i, ii, iii)`,
            `  Main text: Arabic numerals (1, 2, 3...)`,
            `  Footer: centered, bottom of page`,
            ``,
            `CITATIONS`,
            `  Style: IEEE (for Engineering/IT/CS)`,
            `  Style: APA 7th Ed (for Social Science)`,
            ``,
            `BINDING`,
            `  Colour: Dark Blue hard cover`,
            `  Spine: Title, Author, Year`,
            `  Copies: 3 (Dept + Library + Student)`,
        ],
    },
    {
        name: 'Research Ethical Clearance Application',
        description: 'Mandatory application form for any research projects involving human participants, biological samples, or sensitive datasets. Submit at least 6 weeks before research begins.',
        category: 'Ethics',
        fileName: 'Ethical_Clearance_Form.pdf',
        lines: [
            `Principal Investigator: _________________`,
            `Co-Investigators: _______________________`,
            `Research Title: _________________________`,
            `Department: _____________________________`,
            `Expected Start Date: ____________________`,
            ``,
            `SECTION A — RESEARCH DESCRIPTION`,
            `  Purpose: _______________________________`,
            `  Participants: __________________________`,
            `  Number of Participants: ________________`,
            ``,
            `SECTION B — ETHICAL CONSIDERATIONS`,
            `  Risk Level: [ ] Minimal  [ ] Low  [ ] High`,
            `  Informed consent obtained? [ ] Yes  [ ] No`,
            `  Data anonymised? [ ] Yes  [ ] No`,
            `  Vulnerable participants? [ ] Yes  [ ] No`,
            ``,
            `SECTION C — DATA MANAGEMENT`,
            `  Storage location: ______________________`,
            `  Retention period: ______________________`,
            `  Data destruction plan: _________________`,
            ``,
            `Applicant Signature: ____________________`,
            `Supervisor Endorsement: _________________`,
            `Ethics Committee Decision: ______________`,
        ],
    },
    {
        name: 'Final Viva Voce Examination Form',
        description: 'Official form used during the final viva voce (oral examination) for project and thesis defence. Must be completed by the examination panel.',
        category: 'Examination',
        fileName: 'Viva_Voce_Examination_Form.pdf',
        lines: [
            `Student Name: ___________________________`,
            `Registration No: ________________________`,
            `Project Title: __________________________`,
            `Department: _____________________________`,
            `Date of Examination: ____________________`,
            ``,
            `EXAMINATION PANEL`,
            `  Internal Examiner: _____________________`,
            `  External Examiner: _____________________`,
            `  Supervisor (non-voting): _______________`,
            ``,
            `ASSESSMENT CRITERIA (marks out of 100)`,
            `  1. Project Quality & Completeness: _____`,
            `  2. Technical Knowledge:  _____________`,
            `  3. Presentation Skills:  _____________`,
            `  4. Answers to Questions: _____________`,
            `  5. Documentation Quality: _____________`,
            ``,
            `  TOTAL MARKS: _______  GRADE: _________`,
            ``,
            `Result: [ ] PASS   [ ] FAIL   [ ] REFER`,
            ``,
            `Panel Signatures`,
            `  Internal: ___________  Date: __________`,
            `  External: ___________  Date: __________`,
        ],
    },
    {
        name: 'Project Progress Report Template',
        description: 'Bi-monthly progress report template for all final-year project groups. Must be submitted to the supervisor and department coordinator.',
        category: 'Report',
        fileName: 'Project_Progress_Report.pdf',
        lines: [
            `Group Name: _____________________________`,
            `Project Title: __________________________`,
            `Report Period: __________________________`,
            `Report Number: [ ] 1  [ ] 2  [ ] 3  [ ] 4`,
            ``,
            `PROGRESS SUMMARY`,
            `  Work completed this period:`,
            `  _____________________________________`,
            `  _____________________________________`,
            ``,
            `  Work planned for next period:`,
            `  _____________________________________`,
            `  _____________________________________`,
            ``,
            `ISSUES / CHALLENGES`,
            `  Challenge: ___________________________`,
            `  Proposed Solution: ___________________`,
            ``,
            `PERCENTAGE COMPLETION`,
            `  Overall: _______% complete`,
            ``,
            `SUPERVISOR FEEDBACK`,
            `  Comments: ____________________________`,
            `  Supervisor Rating: [ ] On Track  [ ] Delayed`,
            ``,
            `Supervisor Signature: ___________________`,
            `Date: __________________________________`,
        ],
    },
];

const seedTemplates = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB for seeding Form Templates...');

        // Clear existing templates
        await FormTemplate.deleteMany({});
        console.log('🗑  Cleared existing form templates.');

        // Find admin user to assign as uploader
        const admin = await User.findOne({ role: 'admin' });
        if (!admin) {
            console.error('❌ Admin user not found! Please run: node src/utils/seed.js first.');
            process.exit(1);
        }

        // Ensure target templates directory exists
        const templatesDir = path.join(__dirname, '../../uploads/templates');
        fs.mkdirSync(templatesDir, { recursive: true });

        // Create files and save records
        for (const t of TEMPLATES_DATA) {
            const filePath = path.join(templatesDir, t.fileName);
            const pdfBuffer = makePdf(t.name, t.category, t.lines);

            fs.writeFileSync(filePath, pdfBuffer);

            await FormTemplate.create({
                name: t.name,
                description: t.description,
                category: t.category,
                filePath: filePath,
                originalName: t.fileName,
                fileType: 'application/pdf',
                fileSize: pdfBuffer.length,
                uploadedBy: admin._id,
                isActive: true,
            });

            console.log(`✅  "${t.name}" → ${t.fileName}`);
        }

        console.log(`\n🎉 Successfully seeded ${TEMPLATES_DATA.length} form templates!`);
        process.exit(0);
    } catch (err) {
        console.error('❌ Error seeding templates:', err);
        process.exit(1);
    }
};

seedTemplates();
