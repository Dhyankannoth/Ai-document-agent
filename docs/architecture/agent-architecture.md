# Agent Architecture

## Version 1

The initial AI agent architecture follows a sequential pipeline with a bounded feedback loop for correcting documentation validation failures.

**Pipeline:** Repository Scanning → Hybrid Retrieval-Augmented Generation (RAG) → Context Building → Document Generation → Document Validation → Targeted Revision (if required) → Final Validation → Documentation Output.

### Pipeline Components

- **Repository Scanner:** Identifies source code files, existing documentation, relevant symbols, imports, and code relationships required for documentation generation.

- **Hybrid RAG Pipeline:** Combines structural retrieval, keyword-based search, and semantic search to identify source code and existing documentation relevant to the documentation task. Retrieval results are ranked and deduplicated downstream to reduce redundant context.

- **Context Builder:** Organizes the retrieved information, ranks it by relevance, removes duplicates, and assembles supporting evidence within the model's context limits. It prepares the structured context required by the Document Generator.

- **Agent 1 - Document Generator:** Uses the prepared context to generate structured documentation according to the selected documentation style and requirements. Generated documents are represented as identifiable sections so that individual sections can be revised independently.

- **Agent 2 - Document Validator:** Evaluates the generated documentation for factual support, consistency with the source code, valid references, and compliance with the required documentation structure. Where possible, deterministic checks are used for verifiable properties, while semantic consistency checks may use an LLM.

- **Validation Feedback and Targeted Revision:** If validation fails, the validator returns structured feedback identifying the affected sections, validation issues, and supporting evidence where available. The Document Generator uses this feedback to revise only the affected sections, preserving unaffected content wherever possible. The revised sections are then validated again.

- **Final Validation and Documentation Output:** Once the targeted revisions pass their section-level checks, the complete document undergoes a final consistency check. Documentation that passes validation is prepared for output. If validation continues to fail, the system retains the result as an unapproved draft and reports unresolved issues instead of silently marking it as validated.

### Retry and Failure Handling

The initial implementation will permit a maximum of two revision attempts after the initial generation. The orchestrator will enforce this limit to prevent unbounded generation cycles and excessive LLM usage. If failures are widespread or targeted revision is unsuitable, full document regeneration may be used as a controlled fallback.

The initial implementation will prioritize modularity, traceability, efficient context utilization, and bounded LLM usage. More advanced retrieval techniques, validation mechanisms, and recovery strategies can be introduced as the system evolves.

## Architecture Diagram

```mermaid
flowchart TD
    A(["Source Code + Existing Documentation"])

    subgraph RETRIEVAL["1. Retrieval Pipeline"]
        direction TD
        B["Repository Scanner<br/>Discover files, symbols and dependencies"]
        C["Hybrid RAG Pipeline<br/>Structural + Keyword + Semantic Retrieval"]
        D["Context Builder<br/>Rank, deduplicate and enforce token limits"]
        B --> C --> D
    end

    subgraph GENERATION["2. Documentation Generation"]
        E["Agent 1: Document Generator<br/>Generate structured, section-based documentation"]
    end

    subgraph VALIDATION["3. Validation and Revision Pipeline"]
        F["Agent 2: Document Validator<br/>Check factual support, references and structure"]
        G{"Validation passed?"}
        H["Structured Feedback<br/>Identify affected sections and issues"]
        J["Targeted Revision<br/>Revise only affected sections"]
        K{"Revision attempts remaining?"}
        L["Controlled Full Regeneration<br/>Optional fallback for widespread failures"]
        M["Final Document-Level Validation"]
        N(["Validated Documentation"])
        O(["Unapproved Draft<br/>Report unresolved issues"])

        F --> G
        G -->|Yes| M
        G -->|No| H
        H --> K
        K -->|Yes| J
        J --> F
        K -->|No| L
        L --> F
        M --> N
        M -->|Consistency failure| O
    end

    A --> B
    D --> E
    E --> F

    classDef input fill:#E8EAF6,stroke:#5C6BC0,color:#1A237E,stroke-width:2px
    classDef deterministic fill:#E0F2F1,stroke:#00897B,color:#004D40,stroke-width:1.5px
    classDef rag fill:#E3F2FD,stroke:#1E88E5,color:#0D47A1,stroke-width:2px
    classDef agent fill:#F3E5F5,stroke:#8E24AA,color:#4A148C,stroke-width:2px
    classDef decision fill:#FFF3E0,stroke:#FB8C00,color:#E65100,stroke-width:2px
    classDef error fill:#FFEBEE,stroke:#E53935,color:#B71C1C,stroke-width:1.5px
    classDef output fill:#E8F5E9,stroke:#43A047,color:#1B5E20,stroke-width:2px

    class A input
    class B,D deterministic
    class C rag
    class E,F,J,L agent
    class G,K decision
    class H,O error
    class M deterministic
    class N output

    style RETRIEVAL fill:#F8FAFC,stroke:#90A4AE,stroke-width:1px
    style GENERATION fill:#FCF7FF,stroke:#BA68C8,stroke-width:1px
    style VALIDATION fill:#FFFAF2,stroke:#FFB74D,stroke-width:1px
```