/**
 * Phase 24: Bulk Import Utilities
 * Handles parsing and validation of product lists.
 */

export interface ImportResult {
    success: boolean;
    data?: any[];
    error?: string;
    count?: number;
}

export const parseProductCSV = (csvText: string): ImportResult => {
    try {
        const lines = csvText.trim().split('\n');
        if (lines.length < 2) return { success: false, error: 'CSV must contain a header and at least one data row.' };

        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const required = ['name', 'price'];
        const missing = required.filter(h => !headers.includes(h));

        if (missing.length > 0) {
            return { success: false, error: `Missing required columns: ${missing.join(', ')}` };
        }

        const products = lines.slice(1).map((line, index) => {
            const values = line.split(',').map(v => v.trim());
            const row: any = {};

            headers.forEach((header, i) => {
                row[header] = values[i];
            });

            // Basic Validation & Type Casting
            return {
                name: row.name,
                price: parseFloat(row.price) || 0,
                description: row.description || '',
                category: row.category || 'General',
                stock: parseInt(row.stock) || 0,
                image_url: row.image_url || ''
            };
        });

        return { success: true, data: products, count: products.length };
    } catch (err) {
        return { success: false, error: 'Failed to parse CSV. Please check the format.' };
    }
};

export const generateCSVTemplate = (): string => {
    return 'name,price,description,category,stock,image_url\n"Example Coffee",15.00,"Rich dark roast","Beverage",50,"https://example.com/coffee.jpg"';
};
