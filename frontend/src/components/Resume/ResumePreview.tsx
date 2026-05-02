import React from "react";
import type { Resume } from "../../types";
import { FaGithub, FaEnvelope, FaPhone } from "react-icons/fa"

interface Props {
    resume: Resume;
}

const ResumePreview: React.FC<Props> = ({ resume }) => {
    const safeResume = {
        header: {
            ...(resume?.header ?? {}),
            name: resume?.header?.name || "",
            phone: resume?.header?.phone || "",
            email: resume?.header?.email || "",
            github: resume?.header?.github || "",
        },
        objective: resume?.objective || "",
        education: resume?.education || [],
        skills: {
            languages: resume?.skills?.languages || [],
            frameworks: resume?.skills?.frameworks || [],
            other: resume?.skills?.other || [],
        },
        projects: resume?.projects || [],
        activities: resume?.activities || [],
    };

    return (
        <>
            <style>{`
                @media print {
                    .page-break { page-break-before: always; }
                    body { margin: 0; padding: 0; }
                    .resume-container { padding: 40px; font-size: 10pt; }
                }

                .resume-scroll-container {
                    width: 100%;
                    height: 100%;
                    overflow-y: auto;
                    overflow-x: hidden;
                    background-color: white;
                    scrollbar-width: thin;
                    scrollbar-color: #ccc transparent;
                }

                .resume-container {
                    font-family: 'Times New Roman', serif;
                    line-height: 1.4;
                    font-size: 10pt;
                    color: #000;
                    padding: 20px;
                    box-sizing: border-box;
                    width: 100%;
                    max-width: 100%;
                }

                .section-title {
                    font-weight: bold;
                    border-bottom: 1px solid #000;
                    margin-bottom: 4px;
                    padding-bottom: 2px;
                    font-size: 11pt;
                }

                .project-header {
                    display: flex;
                    border-top: 1px solid #000;
                    justify-content: space-between;
                    align-items: baseline;
                    flex-wrap: wrap;
                }
               
                .first-project .project-header {
                    border-top: none;
                }

                .project-title {
                    font-weight: bold;
                }

                .project-date {
                    font-size: 9pt;
                    font-style: italic;
                }

                .tech-stack {
                    font-style: italic;
                    font-size: 9.5pt;
                    margin-top: 1px;
                }

                .event {
                    font-weight: bold;
                    font-size: 9.5pt;
                    margin-bottom: 4px;
                }

                .bullet {
                    margin-left: 20px;
                    text-indent: -12px;
                }

                .bullet::before {
                    content: "• ";
                }
            `}</style>

            <div className="resume-scroll-container">
                <div className="resume-container">
                    <header className="text-center my-3 pb-3">
                        <h1 className="text-2xl font-bold tracking-tight">
                            {safeResume.header.name || "Your Name"}
                        </h1>
                        <p className="text-xs mt-1 flex gap-2 justify-center">
                            {safeResume.header.phone && (
                                <span className="flex items-center gap-1">
                                    <FaPhone /> {safeResume.header.phone}
                                </span>
                            )}
                            {safeResume.header.email && (
                                <span className="flex items-center gap-1">
                                    <FaEnvelope /> {safeResume.header.email}
                                </span>
                            )}
                            {safeResume.header.github && (
                                <span className="flex items-center gap-1">
                                    <FaGithub /> {safeResume.header.github}
                                </span>
                            )}
                        </p>
                    </header>

                    <section className="mb-5">
                        <h2 className="section-title">1 Objective</h2>
                        <p className="text-sm">
                            {safeResume.objective || "Add your career objective here."}
                        </p>
                    </section>

                    <section className="mb-5">
                        <h2 className="section-title">2 Education</h2>
                        {safeResume.education.map((edu, i) => (
                            <div key={i} className="mb-3">
                                <p className="font-bold text-sm">
                                    {edu.institution || "Institution"}
                                </p>
                                <p className="text-sm">
                                    <strong>{edu.degree || "Degree"}</strong>
                                    {edu.duration && ` | ${edu.duration}`}
                                </p>
                                {edu.score && (
                                    <p className="text-xs italic">{edu.score}</p>
                                )}
                            </div>
                        ))}
                    </section>

                    <section className="mb-5">
                        <h2 className="section-title">3 Technical Skills</h2>
                        <ul className="text-sm list-none pl-0 space-y-1">
                            {safeResume.skills.languages.length > 0 && (
                                <li>
                                    <strong>Languages:</strong>{" "}
                                    {safeResume.skills.languages.join(", ")}
                                </li>
                            )}
                            {safeResume.skills.frameworks.length > 0 && (
                                <li>
                                    <strong>Frameworks & Tools:</strong>{" "}
                                    {safeResume.skills.frameworks.join(", ")}
                                </li>
                            )}
                            {safeResume.skills.other.length > 0 && (
                                <li>
                                    <strong>Other:</strong>{" "}
                                    {safeResume.skills.other.join(", ")}
                                </li>
                            )}
                        </ul>
                    </section>

                    <section className="mb-5">
                        <h2 className="section-title">4 Projects</h2>
                        {safeResume.projects.map((proj, i) => (
                            <div key={i} className={`mb-4 ${i === 0 ? "first-project" : ""}`}>
                                <div className="project-header">
                                    <span className="project-title">
                                        {proj.title || "Project Title"}
                                    </span>
                                    <span className="project-date">
                                        {proj.duration || "Month Year"}
                                    </span>
                                </div>
                                {proj.tech && (
                                    <p className="tech-stack">{proj.tech}</p>
                                )}
                                {proj.event && (
                                    <p className="event">{proj.event}</p>
                                )}
                                <ul className="text-sm list-none pl-0">
                                    {proj.points
                                        ?.filter((p) => p.trim())
                                        .map((point, j) => (
                                            <li key={j} className="bullet">
                                                {point}
                                            </li>
                                        ))}
                                </ul>
                            </div>
                        ))}
                    </section>

                    {safeResume.activities.length > 0 && (
                        <section className="mb-5">
                            <h2 className="section-title">
                                5 Extracurricular Activities
                            </h2>
                            <ul className="text-sm list-none pl-0">
                                {safeResume.activities.map((act, i) => (
                                    <li key={i} className="bullet">
                                        {act}
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}

                    <div className="page-break"></div>
                </div>
            </div>
        </>
    );
};

export default ResumePreview;
