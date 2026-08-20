import { fileType } from '../helpers/utils';
import execs from '../helpers/commands/execs';
import { PLAN_LINES, SECRET_LINES } from './eggs';

const execContent = 'Error: can not print an executable file.';

const file = (name, content, extra = {}) =>
    ({ type: fileType.regular, name, content, longView: 'r--', ...extra });
const exec = (name, run) =>
    ({ type: fileType.exec, name, content: [execContent], run, longView: 'r-x' });
const dir = (name, children, extra = {}) =>
    ({ type: fileType.dir, name, children, longView: 'r-x', ...extra });

const aboutLines = [
    "Hi there 👋 I'm Tom Klimovski, Principal at Gamma Data (https://gammadata.io).",
    'We build Data Platforms for the Enterprise.',
    '',
    '-----',
    'Using and manipulating Data in the cloud is what excites me.',
    'I am a specialist GCP consultant with a 20-year history in IT, including a decade of',
    'enterprise-scale GCP implementations for the likes of:',
    '● Cleanaway — Tech Lead',
    '● Bendigo Bank — Tech Lead',
    '● Wesfarmers Health',
    '● ANZ Bank',
    "Startups I've helped with include notion.ai & gopassport.health",
    '',
    '-----',
    "Things we've done at gammadata.io:",
    '● Gitlab/Prefect/Vault/Salesforce/BigQuery/dbt/PowerBI',
    '● Delivered solutions with:',
    '...o High durability of data',
    '...o Robust pipelines and documentation that catch issues early',
    '...o Completely configurable, pythonic syntax for easy debugging',
    '...o ELT architecture on top of a GCP Data Lake',
    '',
    '-----',
    "🚀 Outside of Gamma Data entirely, I'm Co-Founder & Director of Technology",
    'at TectoniQ (https://tectoniq.com.au) — an independent venture.',
    'A strategic talent advisory powered by TIQ, our unified talent intelligence platform —',
    'helping organisations attract, assess, recruit and develop early talent.',
    '',
    '-----',
    'My side projects include',
    '✊ epicarc.io',
    '✊ skicounselling.com',
    '✊ sleeplikegoldilocks.com',
    '',
    '-----',
    '🔭 I’m currently Tech Lead & AI Architect at Cleanaway, and building TIQ at TectoniQ',
    '🌱 I’m currently learning how far AI coding agents can be pushed. Always learning',
    '👯 I’m looking to collaborate on tools that make automation possible',
    '🤔 I’m looking for help with automating Data Governance',
    '💬 Ask me about Delivering Technical Projects',
    '   Read my blog here: https://medium.com/@tom.klimovski',
    '      And here: https://medium.com/@tom.klimovski_90944',
    '------',
];

export const homeFs = dir('~', {
    'about.txt': file('about.txt', aboutLines),
    'cowsay': exec('cowsay', execs['cowsay']),
    'do-not-run-me': exec('do-not-run-me', execs['rick-roll']),
    '.plan': file('.plan', PLAN_LINES, { hidden: true }),
    '.secrets': dir('.secrets', {
        'dont-tell-anyone.txt': file('dont-tell-anyone.txt', SECRET_LINES),
    }, { hidden: true }),
    'projects': dir('projects', {
        'epicarc.txt': file('epicarc.txt', ['epicarc.io — a side project.', 'Status: perpetually nearly done.']),
        'skicounselling.txt': file('skicounselling.txt', ['skicounselling.com — a side project.', 'Downhill from here (in a good way).']),
        'sleeplikegoldilocks.txt': file('sleeplikegoldilocks.txt', ['sleeplikegoldilocks.com — a side project.', 'Just right.']),
    }),
});
