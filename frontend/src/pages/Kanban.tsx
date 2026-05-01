import React, { useEffect, useState } from 'react';
import { Plus, Search, MoreVertical, Clock, Calendar, Tag, MessageSquare } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { taskService } from '@/services/task.service';
import { projectService } from '@/services/project.service';
import { Task, Project, TaskStatus } from '@/types';
import TaskModal from '@/components/tasks/TaskModal';
import { useUI } from '@/context/UIContext';
import { CardSkeleton } from '@/components/ui/Skeleton';

const Kanban = () => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | undefined>(undefined);
    const [initialStatus, setInitialStatus] = useState<TaskStatus>('To Do');
    const { showToast } = useUI();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [t, p] = await Promise.all([taskService.getTasks(), projectService.getProjects()]);
                setTasks(t);
                setProjects(p);
            } catch (error) {
                console.error('Error fetching kanban data:', error);
                showToast('Failed to load tasks', 'error');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [showToast]);

    const onDragEnd = async (result: any) => {
        const { destination, source, draggableId } = result;

        if (!destination) return;

        if (destination.droppableId === source.droppableId && destination.index === source.index) {
            return;
        }

        const newStatus = destination.droppableId as TaskStatus;
        const task = tasks.find(t => t.id === draggableId);

        if (!task) return;

        // Optimistic update
        const updatedTasks = tasks.map(t => (t.id === draggableId ? { ...t, status: newStatus } : t));
        setTasks(updatedTasks);

        try {
            await taskService.updateTask(draggableId, { status: newStatus });
            showToast(`Task moved to ${newStatus}`);
        } catch (error) {
            // Revert on error
            setTasks(tasks);
            showToast('Failed to update task status', 'error');
        }
    };

    const filteredTasks = tasks.filter(t => {
        const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesProject = selectedProjectId === 'all' || t.projectId === selectedProjectId;
        return matchesSearch && matchesProject;
    });

    const getTasksByStatus = (status: TaskStatus) => {
        return filteredTasks.filter(t => t.status === status);
    };

    const columns: { id: TaskStatus; title: string; color: string; bg: string }[] = [
        { id: 'To Do', title: 'To Do', color: 'text-muted-foreground', bg: 'bg-muted/10' },
        { id: 'In Progress', title: 'In Progress', color: 'text-primary', bg: 'bg-primary/10' },
        { id: 'Done', title: 'Completed', color: 'text-foreground/50', bg: 'bg-foreground/5' }
    ];

    const handleSaveTask = async (taskData: Partial<Task>) => {
        try {
            if (selectedTask) {
                const updated = await taskService.updateTask(selectedTask.id, taskData);
                setTasks(prev => prev.map(t => (t.id === updated.id ? updated : t)));
                showToast('Task updated successfully');
            } else {
                const created = await taskService.createTask(taskData);
                setTasks(prev => [...prev, created]);
                showToast('Task created successfully');
            }
            setIsTaskModalOpen(false);
        } catch (error) {
            showToast('Failed to save task', 'error');
        }
    };

    return (
        <div className='h-full flex flex-col space-y-6 md:space-y-8 pb-20'>
            <div className='flex flex-col md:flex-row md:items-center justify-between gap-6 px-1'>
                <div>
                    <h1 className='text-3xl font-black tracking-tight text-foreground'>Kanban Board</h1>
                    <p className='text-muted-foreground mt-1 text-sm font-medium'>Visual workflow management</p>
                </div>
                <div className='flex flex-col sm:flex-row items-center gap-3'>
                    <div className='relative w-full sm:w-64'>
                        <Search
                            className='absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground'
                            size={16}
                        />
                        <input
                            type='text'
                            placeholder='Search tasks...'
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className='input-field pl-10 h-10 py-0'
                        />
                    </div>
                    <select
                        value={selectedProjectId}
                        onChange={e => setSelectedProjectId(e.target.value)}
                        className='input-field h-10 py-0 w-full sm:w-48'
                    >
                        <option value='all'>All Portfolios</option>
                        {projects.map(p => (
                            <option
                                key={p.id}
                                value={p.id}
                            >
                                {p.name}
                            </option>
                        ))}
                    </select>
                    <button
                        onClick={() => {
                            setSelectedTask(undefined);
                            setInitialStatus('To Do');
                            setIsTaskModalOpen(true);
                        }}
                        className='btn-primary h-10 w-full sm:w-auto px-6'
                    >
                        <Plus size={18} />
                        <span className='text-xs'>New Task</span>
                    </button>
                </div>
            </div>

            <div className='flex-1 min-h-0 overflow-x-auto pb-4 custom-scrollbar'>
                <DragDropContext onDragEnd={onDragEnd}>
                    <div className='flex gap-6 h-full min-w-[1000px] md:min-w-0'>
                        {columns.map(column => (
                            <div
                                key={column.id}
                                className='flex-1 flex flex-col min-w-[320px] max-w-[400px]'
                            >
                                <div className='flex items-center justify-between mb-4 px-2'>
                                    <div className='flex items-center gap-2'>
                                        <div
                                            className={`w-2 h-2 rounded-full ${column.color.replace('text-', 'bg-')}`}
                                        ></div>
                                        <h3 className='font-black text-sm uppercase tracking-widest text-foreground'>
                                            {column.title}
                                        </h3>
                                        <span className='bg-secondary text-muted-foreground text-[10px] font-bold px-2 py-0.5 rounded-full border border-border'>
                                            {getTasksByStatus(column.id).length}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setSelectedTask(undefined);
                                            setInitialStatus(column.id);
                                            setIsTaskModalOpen(true);
                                        }}
                                        className='p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-primary transition-all'
                                    >
                                        <Plus size={16} />
                                    </button>
                                </div>

                                <Droppable droppableId={column.id}>
                                    {(provided, snapshot) => (
                                        <div
                                            {...provided.droppableProps}
                                            ref={provided.innerRef}
                                            className={`flex-1 rounded-2xl p-3 space-y-4 transition-colors overflow-y-auto custom-scrollbar border border-transparent ${
                                                snapshot.isDraggingOver
                                                    ? 'bg-secondary/50 border-primary/20'
                                                    : 'bg-secondary/10'
                                            }`}
                                            style={{ minHeight: '500px' }}
                                        >
                                            {loading
                                                ? [1, 2, 3].map(i => <CardSkeleton key={i} />)
                                                : getTasksByStatus(column.id).map((task, index) => (
                                                      <Draggable
                                                          key={task.id}
                                                          draggableId={task.id}
                                                          index={index}
                                                      >
                                                          {(provided, snapshot) => (
                                                              <div
                                                                  ref={provided.innerRef}
                                                                  {...provided.draggableProps}
                                                                  {...provided.dragHandleProps}
                                                                  onClick={() => {
                                                                      setSelectedTask(task);
                                                                      setIsTaskModalOpen(true);
                                                                  }}
                                                                  style={{
                                                                      ...provided.draggableProps.style
                                                                  }}
                                                                  className={`card group hover:border-primary/30 transition-all p-5 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-xl ${
                                                                      snapshot.isDragging
                                                                          ? 'shadow-2xl border-primary ring-2 ring-primary/20 rotate-1'
                                                                          : ''
                                                                  }`}
                                                              >
                                                                  <div className='flex items-center justify-between mb-3'>
                                                                      <span
                                                                          className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${
                                                                              task.priority === 'High'
                                                                                  ? 'bg-foreground text-background border-foreground'
                                                                                  : task.priority === 'Medium'
                                                                                    ? 'bg-secondary text-foreground border-border'
                                                                                    : 'bg-transparent text-muted-foreground border-border'
                                                                          }`}
                                                                      >
                                                                          {task.priority}
                                                                      </span>
                                                                      <MoreVertical
                                                                          size={14}
                                                                          className='text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity'
                                                                      />
                                                                  </div>

                                                                  <h4 className='font-bold text-sm text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2 leading-snug'>
                                                                      {task.title}
                                                                  </h4>

                                                                  <p className='text-[11px] text-muted-foreground line-clamp-2 mb-4 italic leading-relaxed'>
                                                                      {task.description}
                                                                  </p>

                                                                  <div className='flex flex-wrap gap-2 mb-4'>
                                                                      {projects.find(p => p.id === task.projectId)
                                                                          ?.name && (
                                                                          <div className='flex items-center gap-1 bg-secondary px-2 py-0.5 rounded text-[9px] font-bold text-muted-foreground border border-border'>
                                                                              <Tag size={10} />
                                                                              <span>
                                                                                  {
                                                                                      projects.find(
                                                                                          p => p.id === task.projectId
                                                                                      )?.name
                                                                                  }
                                                                              </span>
                                                                          </div>
                                                                      )}
                                                                      {task.tags?.map(tag => (
                                                                          <span
                                                                              key={tag}
                                                                              className='text-[8px] font-black uppercase tracking-widest bg-primary/10 text-primary px-2 py-0.5 rounded border border-primary/20'
                                                                          >
                                                                              {tag}
                                                                          </span>
                                                                      ))}
                                                                  </div>

                                                                  <div className='flex items-center justify-between pt-3 border-t border-border/50'>
                                                                      <div className='flex items-center gap-2'>
                                                                          <div className='w-6 h-6 rounded-lg bg-secondary border border-border flex items-center justify-center overflow-hidden'>
                                                                              <img
                                                                                  src={`https://api.dicebear.com/7.x/initials/svg?seed=${task.assignedTo}`}
                                                                                  alt=''
                                                                              />
                                                                          </div>
                                                                          <div className='flex items-center gap-3'>
                                                                              <div className='flex items-center gap-1 text-[10px] text-muted-foreground font-bold'>
                                                                                  <MessageSquare size={10} />
                                                                                  <span>2</span>
                                                                              </div>
                                                                              {task.actualTime &&
                                                                                  task.actualTime > 0 && (
                                                                                      <div className='flex items-center gap-1 text-[10px] text-muted-foreground font-bold'>
                                                                                          <Clock size={10} />
                                                                                          <span>
                                                                                              {task.actualTime}m
                                                                                          </span>
                                                                                      </div>
                                                                                  )}
                                                                          </div>
                                                                      </div>
                                                                      <div className='flex items-center gap-1.5 text-[9px] font-bold text-muted-foreground italic'>
                                                                          <Calendar size={10} />
                                                                          <span>
                                                                              {new Date(
                                                                                  task.dueDate
                                                                              ).toLocaleDateString(undefined, {
                                                                                  month: 'short',
                                                                                  day: 'numeric'
                                                                              })}
                                                                          </span>
                                                                      </div>
                                                                  </div>
                                                              </div>
                                                          )}
                                                      </Draggable>
                                                  ))}
                                            {provided.placeholder}
                                        </div>
                                    )}
                                </Droppable>
                            </div>
                        ))}
                    </div>
                </DragDropContext>
            </div>

            <TaskModal
                isOpen={isTaskModalOpen}
                onClose={() => setIsTaskModalOpen(false)}
                onSave={handleSaveTask}
                task={selectedTask}
                initialStatus={initialStatus}
            />
        </div>
    );
};

export default Kanban;
