export interface Resume {
    _id?: string;

    userId?: string;
    title: string;
    header: {
        name: string;
        phone: string;
        email: string;
        github: string;
    };
    objective: string;
    education: Array<{
        institution: string;
        degree: string;
        duration: string;
        score: string;
    }>;
    skills: {
        languages: string[];
        frameworks: string[];
        other: string[];
    };
    projects: Array<{
        title: string;
        duration: string;
        tech: string;
        event: string;
        points: string[];
    }>;
    activities: string[];
}
