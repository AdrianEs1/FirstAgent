import { defaultSchema } from 'rehype-sanitize';

export const geminiSanitizeSchema = {
    ...defaultSchema,
    tagNames: [
        ...defaultSchema.tagNames,
        'table',
        'thead',
        'tbody',
        'tr',
        'th',
        'td',
        'br',
        'span',
        'div',
        'pre',
        'code'
    ],
    attributes: {
        ...defaultSchema.attributes,
        '*': [
            ...(defaultSchema.attributes['*'] || []),
            'className',
            'style'
        ],
        code: ['className'],
        span: ['style'],
        div: ['style'],
        td: ['colspan', 'rowspan'],
        th: ['colspan', 'rowspan']
    }
};
