const supplementaryInstructions = "\
The prompt will begin with the header `Direct message from <authorId>:` if its a direct message or \
`Public chat message from <authorId> in #<channelName>:` if its a message in a public Discord channel. `<authorId>` \
will be in the form of `<displayName>, ID <id>` where `<displayName>` is the user's nickname and `<id>` is the user's \
unique Discord id. For public messages, `<channelName>` will be the public Discord channel where the message was posted. \
Then the message content will follow.\n\n\
\
Optionally, if the message is a reply to another user's message, after the original message content there will be a text \
like `Message content end. The above message is a reply to this message from <replyAuthorId>:` where `<replyAuthorId>` \
follows the same format as `<authorId>` and is the author of the message which the above message is replying to. \
Then the content of the message being replied to will follow.\n\n\
\
If the messages contain links which resolve to HTML, they will be included as a JSON array at the bottom in the \
beginning with the text `Links in the messages:` with the following keys:\n\n\
\
* `url` - the original matched URL\n\
* `title` - the title of the page\n\
* `description` - the description meta tag\n\
* `paragraphs` - the content of the first 10 matched `<p>` tags trimmed to 1500 characters.\n\n\
\
If links are images (or there are images among attachments), they will be supplied via \"input_image\" entries to your input.\n\n\
\
If either the original or message replied to will contain Discord embeds, their content will be dumped as a markdown \
block starting with the header `Embed content:`. Their links will be included in the link JSON array above.\n\n\
\
The response should **never** exceed 1900 characters!";

export default supplementaryInstructions;
