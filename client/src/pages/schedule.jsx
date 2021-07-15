import React, { useState } from "react";
import { Tab, Tabs, makeStyles } from "@material-ui/core";
import ScheduleCard from "../components/schedulecard";

function Schedule({ schedule }) {
  const [tab, setTab] = useState(new Date().getDay());

  const useStyles = makeStyles((theme) => ({
    root: {
      flexGrow: 1,
      backgroundColor: theme.palette.background.paper,
    },
  }));

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
        {value === index && <h1>{children}</h1>}
      </div>
    );
  };

  const classes = useStyles();

  return (
    <div className={classes.root}>
      <Tabs value={tab} onChange={handleChange}>
        <Tab label="Sunday" />
        <Tab label="Monday" />
        <Tab label="Tuesday" />
        <Tab label="Wednesday" />
        <Tab label="Thrusday" />
        <Tab label="Friday" />
        <Tab label="Saturday" />
      </Tabs>
      {Object.keys(schedule).length !== 0 ? (
        <>
          <TabPanel value={tab} index={0}>
            <ScheduleCard Anime={schedule.sunday} />
          </TabPanel>
          <TabPanel value={tab} index={1}>
            <ScheduleCard Anime={schedule.monday} />
          </TabPanel>
          <TabPanel value={tab} index={2}>
            <ScheduleCard Anime={schedule.tuesday} />
          </TabPanel>
          <TabPanel value={tab} index={3}>
            <ScheduleCard Anime={schedule.wednesday} />
          </TabPanel>
          <TabPanel value={tab} index={4}>
            <ScheduleCard Anime={schedule.thursday} />
          </TabPanel>
          <TabPanel value={tab} index={5}>
            <ScheduleCard Anime={schedule.friday} />
          </TabPanel>
          <TabPanel value={tab} index={6}>
            <ScheduleCard Anime={schedule.saturday} />
          </TabPanel>
        </>
      ) : (
        ""
      )}
    </div>
  );
}

export default Schedule;
