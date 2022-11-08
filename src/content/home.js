import { fileType } from "../helpers/utils";
import execs from "../helpers/commands/execs";

const execContent = "Error: can not print an executable file.";

export const files = {
    "about.txt": {
        name: "about.txt",
        content: [
            "Hi there 👋 I currently work as a Principal at Gamma Data (https://gammadata.io). We build Data-Platforms for the Enterprise.",
            "I also help groupofhumans.com from my home base in Melbourne, Australia",
            "",
            "-----",
            "My side projects include",
            "✊ epicarc.io",
            "✊ skicounselling.com",
            "✊ sleeplikegoldilocks.com",
            "",
            "-----",
            "Using and manipulating Data in cloud is what excited me.",
            "I am a specialist GCP consultant with a 15-year history in IT, having worked across multiple, enterprise scale GCP implementations ",
            "over the past 5 years including AGL, Department of Premier and Cabinet, ANZ Bank ",
            "Startup's I've helped with include notion.ai & gopassport.health ",
            "-----",
            "I am currently a GCP Platform and Data Developer at https://www.vic.gov.au/department-premier-and-cabinet",
            "● working with the business to identify a new line of reporting that goes out to key Victorian Ministers",
            "● Gitlab/Prefect/Vault/SalesForce/BigQuery/dbt/PowerBI",
            "● Delivered a solution that has:",
            "  o High Durability of Data", 
            "  o Robust pipeline and documentation that catches issues early ",
            "  o Completely configurable, pythonic syntax for easy debugging ",
            "  o ELT architecture on top of a GCP Data Lake",
            "-----",
            "I have led engineering teams focused on delivering features on GCP and establishing engineering and platform foundations, including designing solutions deployed using serverless and GKE based applications (including designing highly available VPC native GKE environments), as well as designing data solutions encompassing real-time and batch ETL, metadata, data treatment, data governance solutions and more. ",
            "I have provided architectural services including writing and presenting Architectural Decision Records (ADR) to peer architecture and am well versed in architectural tools such as PlantUML. ",
            "Having my career start in Data and then become engineering-focussed has given me a well-rounded background in tackling and delivering important business problems.",
            "-----",
            "🔭 I’m currently working on GCP, CI/CD and Data Architecture",
            "🌱 I’m currently learning DBT. Always learning",
            "👯 I’m looking to collaborate on tools that make automation possible",
            "🤔 I’m looking for help with becoming a Contributor on an Open Source project",
            "💬 Ask me about Delivering Technical Projects",
            "   Read my blog here: https://medium.com/@tom.klimovski",
            "      And here: https://medium.com/@tom.klimovski_90944
            "------",
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
