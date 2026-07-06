// Move getFolderSize to top and improve edge-case safety
function getFolderSize(dirPath) {
    if (!fs.existsSync(dirPath)) return 0;
    let total = 0;
    try {
        const files = fs.readdirSync(dirPath);
        for (const file of files) {
            const fullPath = path.join(dirPath, file);
            const stat = fs.statSync(fullPath);
            if (stat.isDirectory()) {
                total += getFolderSize(fullPath);
            } else {
                total += stat.size;
            }
        }
    } catch (err) {
        return 0; // Guard against runtime permission or deletion issues
    }
    return total;
}

// Inside getDashboardStats, replace the final fallback with an explicit 403 response:
        if (role === 'student') {
            // ... student logic remains the same ...
            return res.json({ success: true, data: { ... } });
        }

        // Updated explicit fallback error
        return res.status(403).json({ success: false, message: 'Access denied: Invalid or unhandled role' });
    } catch (error) {
        next(error);
    }
};