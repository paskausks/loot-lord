import { buildHelp, HelpBuilderContext } from '../help';

describe('help utils', () => {
    describe('buildHelp', () => {
        const color = 8604151;
        test.each([
            [
                {
                    title: 'test',
                    description: 'some description',
                },
                {
                    title: 'test',
                    description: 'some description',
                    fields: [],
                    color,
                },
            ],
            [
                {
                    title: 'test',
                    description: 'some description',
                    commands: [
                        {
                            command: 'foo',
                            explanation: 'this is an explanation'
                        },
                        {
                            command: 'bar',
                            explanation: 'more explanations'
                        },

                    ]
                },
                {
                    title: 'test',
                    description: 'some description',
                    fields: [
                        {
                            name: '!foo',
                            value: 'this is an explanation'
                        },
                        {
                            name: '!bar',
                            value: 'more explanations'
                        },
                    ],
                    color,
                },
            ],
            [
                {
                    title: 'test',
                    description: 'some description',
                    commands: [
                        {
                            command: 'foo',
                            explanation: 'this is an explanation'
                        },
                        {
                            command: 'bar',
                            explanation: 'more explanations'
                        },

                    ],
                    additional: [
                        {
                            title: 'foo',
                            value: 'bar',
                        },
                        {
                            title: 'baz',
                            value: 'foo bar baz',
                        }
                    ]
                },
                {
                    title: 'test',
                    description: 'some description',
                    fields: [
                        {
                            name: '!foo',
                            value: 'this is an explanation'
                        },
                        {
                            name: '!bar',
                            value: 'more explanations'
                        },
                        {
                            name: 'foo',
                            value: 'bar',
                        },
                        {
                            name: 'baz',
                            value: 'foo bar baz',
                        }
                    ],
                    color,
                },
            ],
        ])
        (
            'it should build a proper embed object',
            (input: HelpBuilderContext, expected: any) => {
                expect(buildHelp(input)).toEqual({ embed: expected });
            }
        );
    });
});
