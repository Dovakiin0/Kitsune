import React, { useState, useEffect } from "react";
import {
  Tab,
  Tabs,
  makeStyles,
  Paper,
  CircularProgress,
  Grid,
} from "@material-ui/core";
import axios from "axios";
import ScheduleCard from "../components/schedulecard";

function Schedule() {
  const [tab, setTab] = useState(0);
  const [schedule, setSchedule] = useState();
  const [loading, setLoading] = useState(false);

  const useStyles = makeStyles((theme) => ({
    spinner: {
      position: "fixed",
      top: "50%",
      left: "50%",
    },
    root: {
      flexGrow: 1,
      backgroundColor: theme.palette.background.paper,
      display: "flex",
      height: theme.mixins.toolbar,
      width: "100%",
    },
    tabs: {
      borderRight: `1px solid ${theme.palette.divider}`,
    },
  }));

  const getSchedule = () => {
    axios
      .post(
        "http://localhost:3030/api/v1/schedule",
        { day: "" },
        { onDownloadProgress: setLoading(true) }
      )
      .then((sche) => {
        setSchedule(sche.data);
        setLoading(false);
      })
      .catch((err) => console.log(err));
  };

  useEffect(() => {
    getSchedule();
  }, []);

  const handleChange = (e, val) => {
    setTab(val);
  };

  const TabPanel = (props) => {
    const { children, value, index } = props;
    return (
      <div
        role="tabpanel"
        hidden={value !== index}
        id={`vertical-tabpanel-${index}`}
        aria-labelledby={`vertical-tab-${index}`}
        style={{ padding: "10px" }}
      >
        {value == index && <h1>{children}</h1>}
      </div>
    );
  };

  console.log(schedule);

  const classes = useStyles();

  return (
    <Paper style={{ height: "100vh" }}>
      <div className={classes.root}>
        <Tabs
          orientation="vertical"
          value={tab}
          onChange={handleChange}
          className={classes.tabs}
        >
          <Tab label="Monday" />
          <Tab label="Tuesday" />
          <Tab label="Wednesday" />
          <Tab label="Thrusday" />
          <Tab label="Friday" />
          <Tab label="Saturday" />
          <Tab label="Sunday" />
        </Tabs>
        {loading ? (
          <CircularProgress className={classes.spinner} />
        ) : schedule ? (
          <>
            <TabPanel value={tab} index={0}>
              <div style={{ display: "inline" }}>
                {schedule.monday.map((sch, i) => (
                  <ScheduleCard
                    img={sch.img}
                    name={sch.title}
                    epi={sch.episode}
                    airing={new Date(sch.airing_time).toLocaleTimeString()}
                  />
                ))}
              </div>
            </TabPanel>
            <TabPanel value={tab} index={1}>
              {schedule.tuesday.map((sch, i) => (
                <ScheduleCard
                  img={sch.img}
                  name={sch.title}
                  epi={sch.episode}
                  airing={new Date(sch.airing_time).toLocaleTimeString()}
                />
              ))}
            </TabPanel>
            <TabPanel value={tab} index={2}>
              {schedule.wednesday.map((sch, i) => (
                <ScheduleCard
                  img={sch.img}
                  name={sch.title}
                  epi={sch.episode}
                  airing={new Date(sch.airing_time).toLocaleTimeString()}
                />
              ))}
            </TabPanel>
            <TabPanel value={tab} index={3}>
              {schedule.thursday.map((sch, i) => (
                <ScheduleCard
                  img={sch.img}
                  name={sch.title}
                  epi={sch.episode}
                  airing={new Date(sch.airing_time).toLocaleTimeString()}
                />
              ))}
            </TabPanel>
            <TabPanel value={tab} index={4}>
              {schedule.friday.map((sch, i) => (
                <ScheduleCard
                  img={sch.img}
                  name={sch.title}
                  epi={sch.episode}
                  airing={new Date(sch.airing_time).toLocaleTimeString()}
                />
              ))}
            </TabPanel>
            <TabPanel value={tab} index={5}>
              {schedule.saturday.map((sch, i) => (
                <ScheduleCard
                  img={sch.img}
                  name={sch.title}
                  epi={sch.episode}
                  airing={new Date(sch.airing_time).toLocaleTimeString()}
                />
              ))}
            </TabPanel>
            <TabPanel value={tab} index={6}>
              {schedule.sunday.map((sch, i) => (
                <ScheduleCard
                  img={sch.img}
                  name={sch.title}
                  epi={sch.episode}
                  airing={new Date(sch.airing_time).toLocaleTimeString()}
                />
              ))}
            </TabPanel>
          </>
        ) : (
          ""
        )}
      </div>
    </Paper>
  );
}

export default Schedule;
