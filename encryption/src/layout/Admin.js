import React, { useState, useEffect } from "react";
import {
  getAllUsers,
  deleteUser,
  updateUserAdminStatus,
  getLogs,
} from "../utils/serverRequest";
import IconButton from "../components/IconButton";

function Admin({ email, logged, admin }) {
  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [info, setInfo] = useState(false);
  const [selectedUserLogs, setSelectedUserLogs] = useState([]);
  useEffect(() => {
    const fetchUsers = async () => {
      const fetchedUsers = await getAllUsers();
      setUsers(fetchedUsers.filter((user) => user.Email !== email));
    };

    if (logged && admin) fetchUsers();
  }, [email]);

  const handleSelect = (user) => {
    setSelected(user);
  };

  const handleBack = async () => {
    setSelected(null);
    setInfo(false);
  };

  const handleDelete = async (userId) => {
    await deleteUser(userId);
    setSelected(null); // Deselect user after deletion
    // Refresh user list after deletion
    const updatedUsers = await getAllUsers();
    setUsers(updatedUsers.filter((user) => user.Email !== email));
  };
  const handlePrivileges = async (userId) => {
    const user = users.find((u) => u.User_ID === parseInt(userId));
    await updateUserAdminStatus(userId, !user.Is_Admin);
    const updatedUsers = await getAllUsers();
    console.log(!user.Is_Admin);
    setUsers(updatedUsers.filter((user) => user.Email !== email));
    setSelected({ ...user, Is_Admin: !user.Is_Admin });
  };

  const handleInfo = async (userId) => {
    if (info) {
      console.log(info);
      console.log(selectedUserLogs.length > 0);
      setInfo(false);
    } else {
      const user = users.find((u) => u.User_ID === parseInt(userId));
      if (!user) {
        console.error("User not found");
        return;
      }

      try {
        // Fetch all logs (assuming your getLogs() returns an array of logs)
        const allLogs = await getLogs();
        console.log(allLogs);
        const userLogs = allLogs.filter(
          (log) => log.User_ID === parseInt(userId)
        );

        // Store the logs in state
        setSelectedUserLogs(userLogs);
        // Toggle "info" so the button can show "active" styling
        setInfo(true);

        // Optionally update 'selected' so we know which user is in focus
        setSelected(user);
        console.log(info);
        console.log(selectedUserLogs.length > 0);
      } catch (error) {
        console.error("Error fetching user logs:", error);
      }
    }
  };
  useEffect(() => {
    console.log("New logs:", selectedUserLogs);
  }, [selectedUserLogs]);

  useEffect(() => {
    console.log("Info state changed:", info);
  }, [info]);

  return (
    <div className="flexColumn usersWindow">
      {selected ? (
        <div className="flexColumn text">
          <div className="flexRow">
            <IconButton
              name="ArrowBack"
              styleClass="manageButton"
              handler={() => handleBack()}
            />
            {selected.Email}
          </div>
          <div className="flexRow center">
            <IconButton
              name="RemoveUser"
              styleClass="manageButton"
              handler={() => handleDelete(selected.User_ID)}
            />
            <IconButton
              name="Admin"
              styleClass={
                selected.Is_Admin ? "manageButtonActive" : "manageButton"
              }
              handler={() => handlePrivileges(selected.User_ID)}
            />
            <IconButton
              name="Info"
              styleClass={info ? "manageButtonActive" : "manageButton"}
              handler={() => handleInfo(selected.User_ID)}
            />
          </div>
          <div className="flexColumn center logList">
            {info && (
              <div className="flexColumn center">
                {selectedUserLogs.length > 0 ? (
                  selectedUserLogs.map((log) => (
                    <div key={log.Log_ID} className="flexColumn">
                      Action: {log.Action} <br />
                      Timestamp: {log.Access_Timestamp}
                    </div>
                  ))
                ) : (
                  <p>No logs available for this user.</p>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        users.map((user) => (
          <div key={user.User_ID} className="flexRow text">
            {user.Email}
            <IconButton
              name="Manage"
              styleClass="manageButton"
              handler={() => handleSelect(user)}
            />
          </div>
        ))
      )}
    </div>
  );
}

export default Admin;
