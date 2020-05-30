// eslint-disable-next-line import/prefer-default-export
export function isValidSequenceNumber(number: string): boolean {
    const index = number.length - 2;
    const head = number.substring(0, index);
    const tail = number.substring(index);

    if (Number.isNaN(parseInt(head, 10))) {
        return false;
    }

    if (head === '0') {
        return false;
    }

    if (['11', '12', '13'].some((v) => head.substring(head.length - 2, index) === v)) {
        // Kind of special cases
        return tail === 'th';
    }

    switch (head[head.length - 1]) {
    case '1':
        return tail === 'st';
    case '2':
        return tail === 'nd';
    case '3':
        return tail === 'rd';
    case '4':
    case '5':
    case '6':
    case '7':
    case '8':
    case '9':
    case '0':
        return tail === 'th';
    default:
        return false;
    }
}
