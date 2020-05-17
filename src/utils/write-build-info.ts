import signale from 'signale';
import fs from 'fs';
import path from 'path';
import os from 'os';

/**
 * Write build info to be usable at runtime.
 */

signale.info('Writing build info!');

fs.writeFileSync(
    path.join(__dirname, '..', '..', 'build-info.json'),
    JSON.stringify({
        timestamp: new Date().toISOString(),
        os: {
            arch: os.arch(),
            platform: os.arch(),
            release: os.release(),
            type: os.type(),
        },
    }, null, 4),
);
