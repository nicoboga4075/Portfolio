// html-validate transformer for the Nunjucks sources: blanks {% %} and {# #} tags and turns each {{ }} output into a unique placeholder (digits in numeric attributes, "x" + digits elsewhere so it is a valid id), both length- and newline-preserving so reported lines and columns still match the file.
const blank = text => text.replace(/[^\n]/g, ' ');
const numericAttribute = /\b(value|width|height|min|max|step|tabindex|colspan|rowspan)="$/;

// Replaces every open...close span (delimiters included) with replacer(span, offset, data); indexOf keeps it linear, where a lazy [\s\S]*? regex backtracks on an unclosed tag.
function replaceSpans(data, open, close, replacer) {
    let result = '';
    let from = 0;
    let start = data.indexOf(open);
    while (start !== -1) {
        const end = data.indexOf(close, start + open.length);
        if (end === -1) {
            break;
        }
        result += data.slice(from, start) + replacer(data.slice(start, end + close.length), start, data);
        from = end + close.length;
        start = data.indexOf(open, from);
    }
    return result + data.slice(from);
}

function nunjucks(source) {
    let count = 0;
    const placeholder = (text, offset, data) => {
        count++;
        const prefix = numericAttribute.test(data.slice(Math.max(0, offset - 20), offset)) ? '' : 'x';
        const token = prefix + String(count).padStart(text.length - prefix.length, '0');
        let tokenIndex = 0;
        return text.replace(/[^\n]/g, () => token[tokenIndex++] ?? '0');
    };
    const withoutTags = replaceSpans(replaceSpans(source.data, '{%', '%}', blank), '{#', '#}', blank);
    const data = replaceSpans(withoutTags, '{{', '}}', placeholder);
    return [{ ...source, data, transformedBy: ['html-validate-nunjucks'] }];
}

nunjucks.api = 1;

module.exports = nunjucks;
