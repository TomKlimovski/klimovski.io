import { fileType } from "../helpers/utils";
import execs from "../helpers/commands/execs";

const execContent = "Error: can not print an executable file.";

export const files = {
    "about.txt": {
        name: "about.txt",
        content: [
            "Hi there 👋 I currently work as a Coding Architect at Gamma Data (https://gammadata.io).",
            "",
            "-----",
            "I am a specialist GCP consultant with a 15-year history in IT, having worked across multiple, enterprise scale GCP implementations ",
            "over the past 5 years including ANZ Bank and Australian Super. ",
            "-----",
            "I am currently a GCP Architect at https://auspost.com.au/",
            "-----",
            "I have led engineering teams focused on delivering features on GCP and establishing engineering and platform foundations, including designing solutions deployed using serverless and GKE based applications (including designing highly available VPC native GKE environments), as well as designing data solutions encompassing real-time and batch ETL, metadata, data treatment, data governance solutions and more. ",
            "I have provided architectural services including writing and presenting Architectural Decision Records (ADR) to peer architecture and am well versed in architectural tools such as PlantUML. ",
            "Having my career start in Data and then become engineering-focussed has given me a well-rounded background in tackling and delivering important business problems.",
            "-----",
            "🔭 I’m currently working on GCP and Azure, CI/CD and React Deployments",
            "🌱 I’m currently learning Javascript. Always learning",
            "👯 I’m looking to collaborate on tools that make automation possible",
            "🤔 I’m looking for help with automating Data Governance",
            "💬 Ask me about Deployments",
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