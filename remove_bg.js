const { Jimp } = require('jimp');

async function makeTransparent() {
    try {
        const image = await Jimp.read('public/logo.png');
        console.log('Successfully read image. Dimensions:', image.bitmap.width, 'x', image.bitmap.height);

        // We will scan every pixel and make the background transparent
        image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
            const r = this.bitmap.data[idx];
            const g = this.bitmap.data[idx + 1];
            const b = this.bitmap.data[idx + 2];

            // If it's a white pixel, drop alpha to 0 (fully transparent)
            if (r > 240 && g > 240 && b > 240) {
                this.bitmap.data[idx + 3] = 0;
            }
        });

        await image.write('public/logo.png');
        console.log('Successfully wrote transparent logo!');
    } catch (err) {
        console.error('Error processing image:', err);
    }
}

makeTransparent();
