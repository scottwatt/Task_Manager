import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import Auth from "./Auth";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import jwt_decode from "jwt-decode";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "./App.css";
import TaskSidebar from "./Sidebar";
import Modal from "react-modal";
import "./Modal.css";
import "./authStyles.css";
import "./responsive.css"
import 'font-awesome/css/font-awesome.min.css';


Modal.setAppElement("#root");

function App() {
  const [tasks, setTasks] = useState([]);
  const [activeTasks, setActiveTasks] = useState([]);
  const [finishedTasks, setFinishedTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [taskDate, setTaskDate] = useState({ start: null, end: null });
  const [priority, setPriority] = useState('');
  const [currentTaskId, setCurrentTaskId] = useState(null);
  // const [showModal, setShowModal] = useState(false);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [username, setUsername] = useState("");



  const localizer = momentLocalizer(moment);

  const openModal = () => {
    setModalIsOpen(true);
  };

  const closeModal = () => {
    setModalIsOpen(false);
  };

  
  const createTask = async (start, end) => {
    if (title.trim() === "") {
      alert("Task title cannot be empty.");
      return;
    }

    if (description.trim() === "") {
      alert("Task description cannot be empty.");
      return;
    }

    const token = localStorage.getItem("token");
    const decodedToken = jwt_decode(token);
    const userId = decodedToken.userId;
    const currentTime = new Date();
    const taskEndTime = new Date(end || taskDate.end);
  
    const isTaskCompleted = taskEndTime <= currentTime;
  
    await axios.post(`${REACT_APP_URL}/tasks`, {
      title,
      description,
      start: new Date(start || taskDate.start).toISOString(),
      end: taskEndTime.toISOString(),
      completed: isTaskCompleted,
      priority,
      userId,
    });
    setTitle("");
    setDescription("");
    setTaskDate({ start: null, end: null });
    fetchTasks();
    console.log(start, end, "this is the start and end time.");
  };

  const formatTasks = (tasks) => {
    return tasks.map((task) => ({
      ...task,
      start: new Date(task.start),
      end: new Date(task.end),
      priority: task.priority,
    }));
  };

  const handleEditTask = (task) => {
    openModal();
    setTitle(task.title);
    setDescription(task.description);
    setPriority(task.priority);
    setTaskDate({ start: task.start, end: task.end });
    // Store the task's ID to identify which task is being edited
    setCurrentTaskId(task._id);
    console.log('taskId:', task._id);
  };

  const updateTask = async (start, end) => {
    if (title.trim() === "") {
      alert("Task title cannot be empty.");
      return;
    }

    if (description.trim() === "") {
      alert("Task description cannot be empty.");
      return;
    }
    const token = localStorage.getItem("token");
    const decodedToken = jwt_decode(token);
    const userId = decodedToken.userId;
  
    await axios.put(`${REACT_APP_URL}/tasks/${currentTaskId}`, {
      title,
      description,
      start: new Date(start || taskDate.start).toISOString(),
      end: new Date(end || taskDate.end).toISOString(),
      completed: false,
      priority,
      userId,
    }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    setTitle("");
    setDescription("");
    setPriority("");
    setTaskDate({ start: null, end: null });
    setCurrentTaskId(null);
    fetchTasks();
  };
  
  const handleRemoveTask = async (taskId) => {
    try {
      await axios.delete(`${REACT_APP_URL}/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      console.log('taskId:', taskId);
      fetchTasks();
    } catch (error) {
      console.error("Error removing task:", error);
    }
  };
  
  
  
  const fetchTasks = useCallback(async () => {
    const token = localStorage.getItem("token");
    const decodedToken = jwt_decode(token);
    const userId = decodedToken.userId;
  
    try {
      const response = await axios.get(`${REACT_APP_URL}/tasks/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
  
      const fetchedTasks = formatTasks(response.data);
      const currentTime = new Date();
      const activeTasks = fetchedTasks.filter(
        (task) => !task.completed && new Date(task.end) > currentTime
      );
      const finishedTasks = fetchedTasks.filter(
        (task) => task.completed || new Date(task.end) <= currentTime
      );
  
      setActiveTasks(activeTasks);
      setFinishedTasks(finishedTasks);
      setTasks(fetchedTasks);

    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  }, []);

  // const updateTaskStatus = useCallback(() => {
  //   const currentTime = new Date();
  //   const updatedActiveTasks = activeTasks.filter(
  //     (task) => new Date(task.end) > currentTime
  //   );
  //   const updatedFinishedTasks = [
  //     ...finishedTasks,
  //     ...activeTasks.filter((task) => new Date(task.end) <= currentTime),
  //   ];
  
  //   setActiveTasks(updatedActiveTasks);
  //   setFinishedTasks(updatedFinishedTasks);
  // }, [activeTasks, finishedTasks]);
  

  // useEffect(() => {
  //   updateTaskStatus();
  // }, [activeTasks, updateTaskStatus]);
  

  const handleTaskCompletion = async (taskId) => {
    try {
      await axios.put(
        `${REACT_APP_URL}/tasks/${taskId}`,
        { completed: true },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
  
      fetchTasks(); 
    } catch (error) {
      console.error("Error marking task as complete:", error);
    }
  };
  
  

  // function toggleSidebar() {
  //   setShowSidebar(!showSidebar);
  // }
  
  
  // const checkAuthentication = async () => {
  //   const authStatus = localStorage.getItem("isAuthenticated");
  //   if (authStatus) {
  //     setIsAuthenticated(true);
  //   }
  // };
  
  useEffect(() => {
    const authStatus = localStorage.getItem("isAuthenticated");
    if (authStatus) {
      setIsAuthenticated(true);
    }
  }, []);
  

  const handleSelectSlot = (slotInfo) => {
    setTaskDate({ start: slotInfo.start, end: slotInfo.end });
    openModal();
  };

  const { defaultDate, formats } = useMemo(
    () => ({
      defaultDate: new Date(),
      formats: {
        dateFormat: "D",
        weekdayFormat: (date, culture, localizer) =>
          localizer.format(date, "dddd", culture),
        dayFormat: (date, culture, localizer) =>
          localizer.format(date, "dddd Do", culture),
        timeGutterFormat: (date, culture, localizer) =>
          localizer.format(date, "hh:mm a", culture),
      },
    }),
    []
  );

  const handleAuthentication = useCallback((authData) => {
    console.log("Authentication data:", authData);
    setIsAuthenticated(true);
    localStorage.setItem("isAuthenticated", true);
    localStorage.setItem("token", authData.token);
  
    setUsername(authData.username);
    localStorage.setItem("username", authData.username);
  
    fetchTasks();
  }, [fetchTasks]);
  
  
  

  if (!isAuthenticated) {
    return <Auth onAuthenticated={handleAuthentication} />;
  }

  const handleLogout = () => {
    setIsAuthenticated(false);
    setTasks([]); 
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("token");
  };

  const getTaskStyles = (task) => {
    let backgroundColor;
    let textColor = "white";
    switch (task.priority) {
      case 'High':
        backgroundColor = 'red';
        break;
      case 'Medium':
        backgroundColor = 'yellow';
        textColor = "black";
        break;
      case 'Low':
        backgroundColor = 'green';
        break;
      default:
        backgroundColor = 'blue'; // Default color for tasks without priority
    }
  
    return {
      style: {
        backgroundColor,
        color:textColor,
      },
    };
  };

  return (
    <div>
      <div className="logout-location">
        {isAuthenticated && (
          <button onClick={handleLogout}>Log out</button>
        )}
      </div>
      <h1>Hello {username}! Welcome to Task Manager.</h1>
      <Modal isOpen={modalIsOpen} onRequestClose={closeModal} className="task-modal" overlayClassName="react-modal-overlay">
      <h2 className="task-modal-title">
          Add Task for {moment(taskDate.start).format("MMM Do YYYY")}
        </h2>
        {/* Task input fields and buttons */}
        <div>

          <input
            type="text"
            placeholder="Task title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <input
            type="text"
            placeholder="Task description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          >
            <option value="">Select priority</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
        <button
          onClick={() => {
            if (currentTaskId) {
              updateTask();
            } else {
              createTask(taskDate.start, taskDate.end);
            }
            setTaskDate({ start: null, end: null });
            closeModal();
          }}
          className="task-modal-button"
        >
          {currentTaskId ? "Update Task" : "Add Task"}
        </button>
      </Modal>
      <div className="task-button-location">
        <button className="task-button" onClick={() => setShowSidebar(!showSidebar)}>Toggle Tasks</button>
      </div>
      <div>
  
      {showSidebar && (
      <TaskSidebar
        onClose={() => setShowSidebar(false)}
        activeTasks={activeTasks}
        finishedTasks={finishedTasks}
        onEditTask={handleEditTask}
        onCompleteTask={handleTaskCompletion}
        onRemoveTask={handleRemoveTask}
      />
      )}
  
        <div className="app-container">
          <div
            className={`calendar-container ${
              window.innerWidth >= 769 || !showSidebar ? "" : "full-width"
            }`}
          >
            {!showSidebar && (
              <Calendar
                localizer={localizer}
                events={tasks}
                startAccessor="start"
                endAccessor="end"
                titleAccessor="title"
                onSelectEvent={(event) => console.log(event)}
                onSelectSlot={handleSelectSlot}
                selectable
                defaultView="day"
                defaultDate={defaultDate}
                formats={formats}
                eventPropGetter={getTaskStyles}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
  }
  
  

export default App;