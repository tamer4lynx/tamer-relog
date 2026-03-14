import devServer from './devServer';

async function start(opts?: { verbose?: boolean }) {
    await devServer({ verbose: opts?.verbose });
}

export default start;
