// Manual pages. Pure data + lookup; rendered by components/output/ManOutput.

const pad = (s, n) => s + ' '.repeat(Math.max(1, n - s.length));

export const TOUR = [
    { cmd: 'cat about.txt', note: 'who runs this place, and why' },
    { cmd: 'ls -la', note: 'dotfiles are hiding. cat the .plan' },
    { cmd: 'cd .secrets', note: 'a directory nobody was meant to find. ls, then cat' },
    { cmd: 'cd ~/projects', note: 'side projects, one file each. cd ~ to come back' },
    { cmd: './cowsay "hello"', note: 'the classic. Tab completes the filename' },
    { cmd: 'neofetch', note: 'the spec sheet' },
    { cmd: 'git log', note: 'twenty years, one commit at a time' },
    { cmd: 'fortune', note: 'data-engineering wisdom, randomly' },
    { cmd: 'whoami', note: 'ask again. And again' },
    { cmd: 'sudo make me a sandwich', note: 'xkcd 149' },
    { cmd: 'vim', note: 'good luck. :q! is the way out' },
    { cmd: 'snake', note: 'arrow keys. q quits' },
    { cmd: 'cmatrix', note: 'any key wakes you up' },
    { cmd: 'crt', note: '1987 mode. Run it again for 2026' },
    { cmd: 'ssh tiq@tectoniq.com.au', note: "visit the other venture. 'exit' comes home" },
    { cmd: './do-not-run-me', note: "don't" },
    { cmd: 'rm -rf /', note: 'see DANGER' },
];

const tourLines = TOUR.map(({ cmd, note }, i) =>
    `${String(i + 1).padStart(2)}. ${pad(cmd, 26)}${note}`);

const MAIN = {
    title: 'KLIMOVSKI(1)',
    center: 'User Commands',
    sections: [
        { heading: 'NAME', lines: ["klimovski.io — a personal website that thinks it's a shell"] },
        { heading: 'SYNOPSIS', lines: ['man [command]', 'man klimovski'] },
        {
            heading: 'DESCRIPTION',
            lines: [
                "You are guest@internet, sitting in ~ on Tom Klimovski's machine.",
                'Everything here is a command. Nothing here is dangerous.',
                "(One thing is slightly dangerous. It's listed under DANGER.)",
                '',
                "Type 'man <command>' for any command below.",
            ],
        },
        {
            heading: 'GETTING STARTED',
            lines: ['The whole tour, in order. Ten minutes, tops.', '', ...tourLines],
        },
        {
            heading: 'COMMANDS',
            lines: [
                'Filesystem',
                `    ${pad('ls [-la] [path]', 18)}list files. -a shows dotfiles, -l shows perms`,
                `    ${pad('cd [dir]', 18)}change directory. cd alone returns to ~`,
                `    ${pad('pwd', 18)}print working directory`,
                `    ${pad('cat <file>', 18)}print a file`,
                `    ${pad('sh <file>', 18)}run an executable (or ./<file>)`,
                '',
                'Housekeeping',
                `    ${pad('help', 18)}the short version`,
                `    ${pad('man [command]', 18)}this`,
                `    ${pad('history', 18)}what you have typed so far`,
                `    ${pad('whoami', 18)}who you are (negotiable)`,
                `    ${pad('clear', 18)}wipe the screen (also Ctrl+L)`,
                `    ${pad('exit', 18)}leave. Try it`,
                '',
                'Toys',
                `    ${pad('neofetch', 18)}system spec sheet`,
                `    ${pad('fortune', 18)}a proverb for data people`,
                `    ${pad('git log', 18)}career as commit history`,
                `    ${pad('sudo <cmd>', 18)}you are not in the sudoers file`,
                `    ${pad('./cowsay "hi"', 18)}moo`,
                '',
                'Programs',
                `    ${pad('vim, vi', 18)}an editor you cannot leave (you can)`,
                `    ${pad('snake', 18)}eat pipelines. q quits`,
                `    ${pad('cmatrix', 18)}digital rain. any key quits`,
                `    ${pad('ssh <host>', 18)}connect to tiq@tectoniq.com.au`,
                `    ${pad('crt', 18)}toggle the 1987 monitor`,
                `    ${pad('reboot', 18)}replay the boot sequence`,
            ],
        },
        {
            heading: 'KEYS',
            lines: [
                `${pad('Tab', 12)}complete commands and filenames`,
                `${pad('Up / Down', 12)}walk command history`,
                `${pad('Ctrl+L', 12)}clear the screen`,
                `${pad('any key', 12)}skip the boot sequence`,
            ],
        },
        {
            heading: 'DANGER',
            lines: [`${pad('rm -rf /', 12)}deletes everything, then reboots. You will be fine.`],
        },
        {
            heading: 'FILES',
            lines: ['~/about.txt    ~/.plan    ~/.secrets/    ~/projects/'],
        },
        {
            heading: 'SEE ALSO',
            lines: ['gammadata.io, tectoniq.com.au, medium.com/@tom.klimovski'],
        },
        { heading: 'BUGS', lines: ['Report them to nobody. This is a static site.'] },
    ],
};

const MAIN_ALIASES = ['', 'klimovski', 'klimovski.io', 'tom', 'intro'];

export const ENTRIES = {
    ls: {
        summary: 'list directory contents',
        synopsis: 'ls [-a] [-l] [path]',
        description: [
            'List directory contents. -a includes dotfiles, -l shows permissions.',
            "Directories end in '/', executables are highlighted.",
        ],
        examples: ['ls -la', 'ls projects'],
    },
    cd: {
        summary: 'change the working directory',
        synopsis: 'cd [dir]',
        description: ['Change the working directory. With no argument, returns to ~.', "'..' goes up, '~' goes home."],
        examples: ['cd projects', 'cd ..', 'cd ~/.secrets'],
    },
    pwd: { summary: 'print the working directory', synopsis: 'pwd', description: ['Print the working directory.'] },
    cat: {
        summary: 'print a file',
        synopsis: 'cat <file>',
        description: ['Print a file. Paths are relative to the working directory unless they start with ~.'],
        examples: ['cat about.txt', 'cat ~/.plan', 'cat projects/epicarc.txt'],
    },
    sh: {
        summary: 'run an executable',
        synopsis: 'sh <file>   or   ./<file>',
        description: ['Run an executable file. Arguments are passed through.'],
        examples: ['./cowsay "hello"', 'sh cowsay hello'],
    },
    whoami: { summary: 'print the current user', synopsis: 'whoami', description: ['Print the current user. Persistence is rewarded.'] },
    history: { summary: 'show commands entered this session', synopsis: 'history', description: ['Numbered list of commands entered this session.', 'Up and Down recall them.'] },
    help: { summary: 'the short summary', synopsis: 'help', description: ['The polite summary. For the whole tour, see man klimovski.'] },
    man: {
        summary: 'display a manual page',
        synopsis: 'man [command]',
        description: ["Display a manual page. With no argument, or 'klimovski', shows the site tour."],
        examples: ['man', 'man vim', 'man rm'],
    },
    clear: { summary: 'clear the screen', synopsis: 'clear', description: ['Clear the screen. Ctrl+L does the same.'] },
    sudo: {
        summary: 'run a command as the superuser',
        synopsis: 'sudo <command>',
        description: ['Execute a command as the superuser. You are not the superuser.', 'One request is honoured.'],
        examples: ['sudo make me a sandwich'],
    },
    fortune: { summary: 'print a random proverb', synopsis: 'fortune', description: ['Print a random data-engineering proverb.'] },
    git: {
        summary: 'version control for a career',
        synopsis: 'git log | status | push',
        description: ['Version control for a career. log shows the milestones.'],
        examples: ['git log', 'git status'],
    },
    exit: {
        summary: 'leave the current session',
        synopsis: 'exit',
        description: ['Inside an ssh session, disconnects and returns home.', 'At home, there is no escape.'],
    },
    neofetch: { summary: 'system information with logo', synopsis: 'neofetch', description: ['System information with logo. OS: TomOS.'] },
    reboot: { summary: 'replay the boot sequence', synopsis: 'reboot', description: ['Replay the BIOS boot sequence and clear the screen.', 'Any key skips it.'] },
    vim: {
        summary: 'an editor you cannot leave',
        synopsis: 'vim   or   vi',
        description: [
            'Open a convincing empty buffer. i enters insert mode, Escape leaves it,',
            ': starts a command. Only :q! gets you out. Your time is recorded.',
        ],
    },
    cmatrix: { summary: 'full-screen digital rain', synopsis: 'cmatrix', description: ['Full-screen digital rain. Press any key to stop.'] },
    snake: {
        summary: 'eat pipelines, avoid walls',
        synopsis: 'snake',
        description: ['Classic snake, but the food is data packets. Arrow keys steer, q quits.', 'Score is reported in pipelines eaten.'],
    },
    rm: {
        summary: 'remove files, allegedly',
        synopsis: 'rm [-rf] <target>',
        description: [
            'Remove files. Every target is permission denied, except the one that is not.',
            'rm -rf / removes everything, halts the system, and reboots into a clean shell.',
            'Nothing is actually lost.',
        ],
    },
    ssh: {
        summary: 'connect to the TectoniQ machine',
        synopsis: 'ssh tiq@tectoniq.com.au',
        description: [
            'Open a session on the TectoniQ machine: new prompt, new theme, its own files.',
            "ls and cat work there too. 'exit' disconnects.",
        ],
        examples: ['ssh tectoniq', 'ssh tiq@tectoniq.com.au'],
    },
    crt: { summary: 'toggle the 1987 monitor', synopsis: 'crt', description: ['Toggle scanlines, vignette and flicker. Remembered between visits.'] },
    cowsay: { summary: 'a talking cow', synopsis: './cowsay "<text>"', description: ['A cow says what you tell it to.'], examples: ['./cowsay "hello"'] },
    'do-not-run-me': { summary: 'do not run this', synopsis: './do-not-run-me', description: ["Don't.", 'See ~/.secrets for a second opinion.'] },
};

const ALIASES = { vi: 'vim' };

const entryPage = (name, entry) => ({
    title: `${name.toUpperCase()}(1)`,
    center: 'User Commands',
    sections: [
        { heading: 'NAME', lines: [`${name} — ${entry.summary}`] },
        { heading: 'SYNOPSIS', lines: [entry.synopsis] },
        { heading: 'DESCRIPTION', lines: entry.description },
        ...(entry.examples ? [{ heading: 'EXAMPLES', lines: entry.examples }] : []),
        { heading: 'SEE ALSO', lines: ['man klimovski'] },
    ],
});

export const getManPage = (name) => {
    let key = (name || '').toLowerCase();
    if (key.startsWith('./')) key = key.slice(2);
    if (MAIN_ALIASES.includes(key)) return MAIN;
    key = ALIASES[key] || key;
    const entry = ENTRIES[key];
    return entry ? entryPage(key, entry) : null;
};
