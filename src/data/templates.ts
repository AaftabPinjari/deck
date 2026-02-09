import { Block } from '../store/useDocumentStore';

export interface Template {
    id: string;
    name: string;
    icon: string;
    description: string;
    blocks: Omit<Block, 'id'>[];
}

export const templates: Template[] = [
    {
        id: 'empty',
        name: 'Empty Page',
        icon: '📄',
        description: 'Start with a blank page',
        blocks: [
            { type: 'text', content: '' }
        ]
    },
    {
        id: 'meeting-notes',
        name: 'Meeting Notes',
        icon: '📝',
        description: 'Capture meeting discussions and action items',
        blocks: [
            { type: 'h2', content: '📅 Meeting Details' },
            { type: 'text', content: '**Date:** ' },
            { type: 'text', content: '**Attendees:** ' },
            { type: 'text', content: '' },
            { type: 'h2', content: '📋 Agenda' },
            { type: 'bullet', content: '' },
            { type: 'bullet', content: '' },
            { type: 'bullet', content: '' },
            { type: 'text', content: '' },
            { type: 'h2', content: '📝 Notes' },
            { type: 'text', content: '' },
            { type: 'text', content: '' },
            { type: 'h2', content: '✅ Action Items' },
            { type: 'todo', content: '' },
            { type: 'todo', content: '' },
            { type: 'todo', content: '' }
        ]
    },
    {
        id: 'project-plan',
        name: 'Project Plan',
        icon: '🚀',
        description: 'Plan and track a project from start to finish',
        blocks: [
            { type: 'h1', content: '🚀 Project Overview' },
            { type: 'text', content: 'Describe the project goal and scope here...' },
            { type: 'divider', content: '' },
            { type: 'h2', content: '🎯 Goals' },
            { type: 'bullet', content: 'Goal 1' },
            { type: 'bullet', content: 'Goal 2' },
            { type: 'bullet', content: 'Goal 3' },
            { type: 'text', content: '' },
            { type: 'h2', content: '📆 Timeline' },
            { type: 'text', content: '| Phase | Start Date | End Date | Status |' },
            { type: 'text', content: '|-------|------------|----------|--------|' },
            { type: 'text', content: '| Planning | | | 🟡 In Progress |' },
            { type: 'text', content: '| Development | | | ⚪ Not Started |' },
            { type: 'text', content: '| Testing | | | ⚪ Not Started |' },
            { type: 'text', content: '' },
            { type: 'h2', content: '👥 Team & Resources' },
            { type: 'bullet', content: '' },
            { type: 'text', content: '' },
            { type: 'h2', content: '✅ Tasks' },
            { type: 'todo', content: 'Task 1' },
            { type: 'todo', content: 'Task 2' },
            { type: 'todo', content: 'Task 3' }
        ]
    },
    {
        id: 'weekly-planner',
        name: 'Weekly Planner',
        icon: '📅',
        description: 'Plan your week with daily to-do lists',
        blocks: [
            { type: 'h1', content: '📅 Weekly Planner' },
            { type: 'text', content: 'Week of: _____________' },
            { type: 'divider', content: '' },
            { type: 'h2', content: '🌙 Monday' },
            { type: 'todo', content: '' },
            { type: 'todo', content: '' },
            { type: 'h2', content: '🌙 Tuesday' },
            { type: 'todo', content: '' },
            { type: 'todo', content: '' },
            { type: 'h2', content: '🌙 Wednesday' },
            { type: 'todo', content: '' },
            { type: 'todo', content: '' },
            { type: 'h2', content: '🌙 Thursday' },
            { type: 'todo', content: '' },
            { type: 'todo', content: '' },
            { type: 'h2', content: '🌙 Friday' },
            { type: 'todo', content: '' },
            { type: 'todo', content: '' },
            { type: 'divider', content: '' },
            { type: 'h2', content: '🎉 Weekend Goals' },
            { type: 'todo', content: '' },
            { type: 'todo', content: '' }
        ]
    },
    {
        id: 'reading-list',
        name: 'Reading List',
        icon: '📚',
        description: 'Track books you want to read',
        blocks: [
            { type: 'h1', content: '📚 Reading List' },
            { type: 'text', content: '' },
            { type: 'h2', content: '📖 Currently Reading' },
            { type: 'bullet', content: '' },
            { type: 'text', content: '' },
            { type: 'h2', content: '📕 To Read' },
            { type: 'bullet', content: '' },
            { type: 'bullet', content: '' },
            { type: 'bullet', content: '' },
            { type: 'text', content: '' },
            { type: 'h2', content: '✅ Finished' },
            { type: 'bullet', content: '' }
        ]
    },
    {
        id: 'personal-journal',
        name: 'Personal Journal',
        icon: '✨',
        description: 'Daily reflection and gratitude',
        blocks: [
            { type: 'h1', content: '✨ Journal Entry' },
            { type: 'text', content: '**Date:**' },
            { type: 'divider', content: '' },
            { type: 'h2', content: '😊 Mood' },
            { type: 'text', content: 'How are you feeling today?' },
            { type: 'text', content: '' },
            { type: 'h2', content: '🙏 Gratitude' },
            { type: 'text', content: 'Three things I\'m grateful for:' },
            { type: 'number', content: '' },
            { type: 'number', content: '' },
            { type: 'number', content: '' },
            { type: 'text', content: '' },
            { type: 'h2', content: '💭 Reflections' },
            { type: 'text', content: '' },
            { type: 'text', content: '' },
            { type: 'h2', content: '🎯 Tomorrow\'s Intentions' },
            { type: 'todo', content: '' },
            { type: 'todo', content: '' }
        ]
    }
];

export function getTemplateById(id: string): Template | undefined {
    return templates.find(t => t.id === id);
}
