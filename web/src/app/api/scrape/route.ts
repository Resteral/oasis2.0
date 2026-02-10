import { NextResponse } from 'next/server'
import * as cheerio from 'cheerio'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const url = searchParams.get('url')

    if (!url) {
        return NextResponse.json({ error: 'URL required' }, { status: 400 })
    }

    try {
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'OasisBot/1.0'
            }
        })
        const html = await res.text()
        const $ = cheerio.load(html)

        const title = $('meta[property="og:title"]').attr('content') || $('title').text()
        const image = $('meta[property="og:image"]').attr('content')
        const description = $('meta[property="og:description"]').attr('content')

        // Attempt basic price detection
        let price: string | null = $('meta[property="product:price:amount"]').attr('content') || null

        if (!price) {
            // Simple regex fallback for price
            const priceMatch = html.match(/\$[\d,]+\.\d{2}/)
            if (priceMatch) price = priceMatch[0]
        }

        return NextResponse.json({
            title,
            image,
            description,
            price,
            url
        })
    } catch (error) {
        return NextResponse.json({ error: 'Failed to scrape' }, { status: 500 })
    }
}
