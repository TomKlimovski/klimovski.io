import { fileType } from "../helpers/utils";
import execs from "../helpers/commands/execs";

const execContent = "Error: can not print an executable file.";

export const files = {
    "about.txt": {
        name: "about.txt",
        content: [
            "Hello, I am Tom. I currently work as a GCP Coding Architect at Gamma Data (https://gammadata.io).",
            "-----",
            "Cloud advocate. Reach out to me about building teams and delivering GCP/Azure type software project. Everything as Code ",
            "I'm always looking to learn something new. I like a good API and an even better IPA",
            "------", 
            "This site has been lovingly ripped from (https://github.com/aavshr/aava.sh)."
        ],
        type: fileType.regular,
        longView: 'r--',
    },
    "cowsay": {
        name: "cowsay",
        content: [execContent],
        type: fileType.exec,
        run: execs['cowsay'],
        longView: 'r-x',
    },
    "do-not-run-me": {
        name: "do-not-run-me",
        content: [execContent],
        type: fileType.exec,
        run: execs['rick-roll'],
        longView: 'r-x',
    },
}