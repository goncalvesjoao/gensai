import process from 'node:process';
import { spawn } from 'node:child_process';

// Own detached process groups and wait for captured output before reporting completion.
export function createSupervisor() {
  const children = new Set();
  function kill(child, signal) {
    if (!child.pid) return;
    try {
      process.kill(-child.pid, signal);
    } catch (error) {
      if (error.code !== 'ESRCH') throw error;
    }
  }
  function launch(
    command,
    argv,
    { stream, cwd, env = {}, endStream = true } = {},
  ) {
    const child = spawn(command, argv, {
      cwd,
      detached: true,
      env: { ...process.env, ...env },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    children.add(child);
    for (const [pipe, destination] of [
      [child.stdout, process.stdout],
      [child.stderr, process.stderr],
    ])
      pipe.on('data', (data) => {
        stream.write(data);
        destination.write(data);
      });
    child.done = new Promise((resolveDone) => {
      child.on('error', (error) => stream.write(`${error.stack}\n`));
      child.on('close', (code, signal) => {
        child.result = code ?? (signal ? 130 : 1);
        if (endStream) stream.end(() => resolveDone(child.result));
        else resolveDone(child.result);
      });
    });
    return child;
  }
  function terminate(signal = 'SIGTERM') {
    for (const child of children) kill(child, signal);
  }
  async function cleanup() {
    terminate();
    let timer;
    await Promise.race([
      Promise.all([...children].map((child) => child.done)),
      new Promise((resolve) => {
        timer = setTimeout(resolve, 1000);
      }),
    ]);
    clearTimeout(timer);
    terminate('SIGKILL');
    await Promise.all([...children].map((child) => child.done));
  }
  return { launch, terminate, cleanup, kill };
}
