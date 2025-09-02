# AI Development Framework - Project Context

## Project Overview
**Purpose**: Comprehensive AI-assisted development framework for systematic software engineering  
**Version**: 2.0.0  
**Last Updated**: 2025-09-02  
**Maintainer**: joaoariedi@gmail.com

## Tech Stack
- **Language**: Markdown documentation
- **Version Control**: Git with semantic commits
- **CI/CD**: None (documentation project)
- **IDE**: Neovim with LazyVim configuration
- **AI Tools**: Claude Code + GitHub Copilot integration

## Architecture Overview
The framework follows a 4-phase, 18-step systematic approach:

1. **Phase 1: Planning & Context (Steps 1-4)**
   - Context preparation and management
   - Comprehensive planning with risk assessment
   - Documentation with ADRs
   - Iterative refinement

2. **Phase 2: Implementation (Steps 5-10)**
   - Quality gates and pre-commit hooks
   - Feature branching strategy
   - Incremental development with documentation
   - Testing and quality validation

3. **Phase 3: Review & Integration (Steps 11-16)**
   - CI/CD pipeline integration
   - Multi-AI code review process
   - Feedback loop optimization
   - Clean merge with validation

4. **Phase 4: Post-Merge (Steps 17-18)**
   - Metrics collection and analysis
   - Continuous improvement retrospectives

## Coding Conventions

### File Naming
- Framework docs: `UPPERCASE_WITH_UNDERSCORES.md`
- Plan files: `PLAN_DESCRIPTIVE_NAME.md` (gitignored)
- Context files: `PROJECT_CONTEXT.md`
- Configuration: `.claude/CLAUDE.md`

### Documentation Standards
- Use clear, actionable language
- Include specific metrics and targets
- Provide examples and templates
- Maintain version history
- Reference file paths as `file_path:line_number`

### Markdown Conventions
- Use emoji for visual hierarchy (🚀 🎯 📋 ⚡ etc.)
- Tables for structured data
- Mermaid diagrams for workflows
- Code blocks with language specification
- Checklists for actionable items

## Common Patterns

### Quality Metrics Pattern
```markdown
### [Category] Metrics
- **[Metric Name]**: [Target] [Unit]
- **[Metric Name]**: [Target] [Unit]
```

### Step Documentation Pattern
```markdown
#### [Step Number]. **[Step Name]**
   - [Action item 1]
   - [Action item 2]
   - [Specific requirement with target]
```

### Configuration Pattern
```markdown
### [Section Name]
- [Requirement]: [Specific implementation]
- [Standard]: [Measurable criteria]
```

## Anti-Patterns to Avoid
- ❌ Vague requirements without metrics
- ❌ Missing time estimates
- ❌ Incomplete checklists
- ❌ Inconsistent formatting
- ❌ Outdated version references
- ❌ Missing file path references

## Integration Points

### AI Model Usage
- **Claude**: Strategic planning, complex reasoning, comprehensive implementation
- **Copilot**: Code review, pattern recognition, completion suggestions
- **Framework**: Multi-AI validation for higher quality outcomes

### Development Tools
- **Git**: Semantic commits, feature branches, clean history
- **GitHub**: Pull requests, issue tracking, project management
- **Pre-commit**: Quality gates, automated checks
- **CI/CD**: Pipeline validation, automated testing

## Performance Benchmarks

### Framework Usage Metrics
- **Planning Phase**: 15-30 minutes
- **Implementation Phase**: < 2 hours for small features
- **Review Cycles**: < 3 iterations
- **Documentation Coverage**: 100% for public interfaces

### Quality Targets
- **Readability**: Self-documenting with examples
- **Completeness**: All steps actionable
- **Maintainability**: Version controlled with update schedule
- **Adoption**: Zero configuration required to start

## Security Considerations
- No sensitive data in documentation
- All examples use placeholder values
- Framework promotes security best practices
- Regular review of external references

## Future Roadmap

### v2.1 (Q1 2025)
- [ ] Team collaboration enhancements
- [ ] Integration with more AI models
- [ ] Advanced metrics dashboard
- [ ] Automated framework validation

### v3.0 (Q2 2025)
- [ ] Multi-language support
- [ ] Framework customization templates
- [ ] AI model performance optimization
- [ ] Enterprise team features

## Dependencies
- Git (version control)
- GitHub CLI (optional, for PR automation)
- Pre-commit framework (quality gates)
- Neovim/LazyVim (recommended IDE)
- Claude Code integration
- GitHub Copilot (code review)

## Support and Maintenance

### Update Triggers
- New AI model capabilities
- User feedback and pain points
- Technology stack changes
- Performance metrics analysis
- Security requirement updates

### Review Schedule
- **Weekly**: Active usage feedback
- **Monthly**: Framework effectiveness review
- **Quarterly**: Major version updates
- **Annually**: Complete framework audit

### Contact
- **Primary**: joaoariedi@gmail.com
- **Issues**: Framework-specific issue tracker
- **Documentation**: This PROJECT_CONTEXT.md file

---

*This context file should be updated after any significant framework changes*