import { fileType } from '../helpers/utils';

const file = (name, content) =>
    ({ type: fileType.regular, name, content, longView: 'r--' });

export const tectoniqFs = {
    type: fileType.dir,
    name: '~',
    longView: 'r-x',
    children: {
        'about.txt': file('about.txt', [
            'TectoniQ — better early talent decisions start here.',
            'An independent venture (no, not a Gamma Data thing).',
            '',
            'We pair strategic talent advisory with TIQ, our unified',
            'talent intelligence platform, across the early-talent',
            'lifecycle: Attract, Match, Assess, Recruit, Develop, Perform.',
            '',
            'https://tectoniq.com.au',
        ]),
        'team.txt': file('team.txt', [
            'Paula Gepp        Co-Founder, Director of Strategy & Operations',
            'David Cvetkovski  Co-Founder, Director of Strategy & Customer Engagement',
            'Tom Klimovski     Co-Founder, Director of Technology',
            'Mark Stella       Co-Founder, Director of Data & Architecture',
        ]),
    },
};
