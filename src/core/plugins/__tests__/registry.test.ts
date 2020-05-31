import { initPlugins } from '../registry';
import Plugin, { PluginInitOptions } from '../plugin';

class TestPlugin extends Plugin {}

describe('plugin registry', () => {
    describe('initPlugins', () => {
        it('should properly initialize the given plugins', () => {
            const client = { users: [] };
            const knex = { select: () => null };

            TestPlugin.create = jest.fn((options: PluginInitOptions) => {
                expect(options.client).toEqual(client);
                expect(options.knex).toEqual(knex);
                return new TestPlugin(options)
            });

            const [plugin] = initPlugins({
                client: client as any,
                knex: knex as any,
            }, [TestPlugin]);

            expect(TestPlugin.create).toBeCalled();
            expect(plugin instanceof TestPlugin).toBeTruthy();
        });
    });
});
