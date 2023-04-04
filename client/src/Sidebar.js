import React, { useState } from "react";
import moment from "moment";
import "font-awesome/css/font-awesome.min.css";
import "./Sidebar.css";
import './responsive.css';

const getBackgroundColor = (priority) => {
  switch (priority) {
    case "High":
      return "rgba(255, 0, 0, 0.2)";
    case "Medium":
      return "rgba(255, 255, 0, 0.2)";
    case "Low":
      return "rgba(0, 255, 0, 0.2)";
    default:
      return "rgba(0, 0, 255, 0.2)";
  }
};

const Task = ({ task, onEditTask, onRemoveTask }) => {
  const [showMenu, setShowMenu] = useState(false);

  const toggleMenu = () => {
    setShowMenu(!showMenu);
  };

  return (
    <li
      key={task._id}
      className="task-item"
      style={{ backgroundColor: getBackgroundColor(task.priority) }}
    >
      <div className="task-details">
        <h3>{task.title}</h3>
        <p>{task.description}</p>
        <p>Priority: {task.priority}</p>
        <p>Start: {moment(task.start).format("MMM Do YYYY, h:mm a")}</p>
        <p>End: {moment(task.end).format("MMM Do YYYY, h:mm a")}</p>
      </div>
      <div className="task-actions">
        <i className="fa fa-cog" onClick={toggleMenu} />
        {showMenu && (
          <div className="actions-dropdown">
            <button onClick={() => onEditTask(task)}>Edit</button>
            <button onClick={() => onRemoveTask(task._id)}>Remove</button>
          </div>
        )}
      </div>
    </li>
  );
};

const TaskSidebar = ({ tasks, onEditTask, onRemoveTask, onClose }) => {
  const sortTasks = (tasks) => {
    return tasks.sort((a, b) => {
      const timeDiffA = new Date(a.start) - new Date();
      const timeDiffB = new Date(b.start) - new Date();

      if (timeDiffA !== timeDiffB) {
        return timeDiffA - timeDiffB;
      }

      return b.priority - a.priority;
    });
  };

  const sortedTasks = sortTasks(tasks);

  return (
    <div className="task-sidebar" onClick={onClose}>
      <div className="task-sidebar-content" onClick={(e) => e.stopPropagation()}>
      <button className="toggle-tasks-btn" onClick={onClose}>
          Toggle Tasks
        </button>
        <h2 className="task-title">Tasks</h2>
        <ul>
          {sortedTasks.map((task) => (
            <Task
              key={task._id}
              task={task}
              onEditTask={onEditTask}
              onRemoveTask={onRemoveTask}
            />
          ))}
        </ul>
      </div>
    </div>
  );
};

export default TaskSidebar;

