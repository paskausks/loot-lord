export enum URLType {
    HTML,
    Image
}


export default interface URLCrawlResult {
    type: URLType,
    url: string;

    // only if type is HTML
    title?: string;
    description?: string;
    paragraphs?: string;
}
