// Inside getDashboardStats admin check block:

            // BEFORE:
            // let storageBytes = 0;
            // try { ... } catch { ... }

            // AFTER (Clean and direct):
            const uploadsDir = path.join(__dirname, '../../uploads');
            const storageBytes = getFolderSize(uploadsDir);

            // Rest of your metric aggregation logic remains matching, perfectly organized...