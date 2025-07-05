const resetPrompt: string = '\
Summarize the converation state in around 3 paragraphs with the goal that this will be the starting prompt of a new \
conversation, albeit a continuation of the current one. Then list the conversation participants known to you in the \
format `<displayName>, ID <id>` where `<displayName>` is the user\'s nickname and `<id>` is the user\'s unique \
Discord id. Then next to that write a 2-3 sentence summary of how you would describe said user. Don\'t include yourself \
in this list.\n\n The tone of this summary should be neutral, as this will serve as the initial "configuration" \
alongside the instruction block.';

export default resetPrompt;
