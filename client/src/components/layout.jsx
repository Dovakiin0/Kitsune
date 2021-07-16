import React, { useState, useEffect, useContext } from "react";
import {
  Drawer,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  AppBar,
  Toolbar,
  Switch,
  InputBase,
} from "@material-ui/core";
import { makeStyles, alpha } from "@material-ui/core/styles";
import { HomeRounded, ImageRounded, SearchOutlined } from "@material-ui/icons";
import { useHistory, useLocation } from "react-router-dom";
import { DarkModeContext } from "../context/AnimeContext";
import SearchList from "../components/searchList";
import axios from "axios";

const drawerWidth = 240;

const useStyles = makeStyles((theme) => {
  return {
    root: {
      display: "flex",
    },
    drawerPaper: {
      width: drawerWidth,
    },
    page: {
      width: "100%",
      padding: 10,
    },
    drawer: {
      width: drawerWidth,
    },
    active: {
      background: "rgba(255, 255, 255, 0.16)",
    },
    title: {
      padding: 15,
      letterSpacing: "0.1rem",
    },
    appbar: {
      width: `calc(100% - ${drawerWidth}px)`,
    },
    toolbar: theme.mixins.toolbar,
    time: {
      flexGrow: 1,
    },
    footer: {
      marginTop: "auto",
      textAlign: "center",
    },
    search: {
      position: "relative",
      borderRadius: theme.shape.borderRadius,
      backgroundColor: alpha(theme.palette.common.white, 0.15),
      "&:hover": {
        backgroundColor: alpha(theme.palette.common.white, 0.25),
      },
      marginLeft: 0,
      width: "100%",
      [theme.breakpoints.up("sm")]: {
        marginLeft: theme.spacing(1),
        width: "auto",
      },
    },
    searchIcon: {
      padding: theme.spacing(0, 2),
      height: "100%",
      position: "absolute",
      pointerEvents: "none",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    inputInput: {
      padding: theme.spacing(1, 1, 1, 0),
      // vertical padding + font size from searchIcon
      paddingLeft: `calc(1em + ${theme.spacing(4)}px)`,
      transition: theme.transitions.create("width"),
      width: "100%",
      [theme.breakpoints.up("sm")]: {
        width: "12ch",
        "&:focus": {
          width: "20ch",
        },
      },
    },
  };
});

function Layout({ children }) {
  const classes = useStyles();
  const history = useHistory();
  const location = useLocation();
  const [searchResult, setSearchResult] = useState([]);
  const [time, setTime] = useState(new Date().toLocaleTimeString());
  const { darkMode, setDarkMode } = useContext(DarkModeContext);
  const [keyword, setKeyword] = useState("");

  useEffect(() => {
    setInterval(() => {
      setTime(new Date().toLocaleTimeString());
    }, 1000);
  }, []);

  const menuItems = [
    {
      text: "HomePage",
      icon: <HomeRounded />,
      path: "/",
    },
    {
      text: "Waifu Pics",
      icon: <ImageRounded />,
      path: "/waifu",
    },
  ];

  const handleSwitch = (event) => {
    setDarkMode(event.target.checked);
  };

  const handleSearch = (event) => {
    const { value } = event.target;
    setKeyword(value);
  };

  const getSearchAnime = () => {
    if (keyword) {
      axios
        .get(`/api/v1/anime/${keyword}`)
        .then((response) => {
          setSearchResult(response.data);
        })
        .catch((err) => console.log(err));
    } else {
      setSearchResult([]);
    }
  };

  const handleResetKeyword = () => {
    setKeyword("");
  };

  useEffect(() => {
    let timer = setTimeout(() => getSearchAnime(), 1000);
    return () => clearTimeout(timer);
  }, [keyword]);

  return (
    <div className={classes.root}>
      {keyword !== "" ? (
        <SearchList
          results={searchResult}
          handleResetKeyword={handleResetKeyword}
        />
      ) : (
        ""
      )}
      <AppBar className={classes.appbar} color="dafault">
        <Toolbar>
          <Typography className={classes.time}>{time}</Typography>
          <div className={classes.search}>
            <div className={classes.searchIcon}>
              <SearchOutlined />
            </div>
            <InputBase
              placeholder="Search…"
              classes={{
                root: classes.inputRoot,
                input: classes.inputInput,
              }}
              inputProps={{ "aria-label": "search" }}
              onChange={handleSearch}
              value={keyword}
            />
          </div>
          <Switch checked={darkMode} onChange={handleSwitch} />
        </Toolbar>
      </AppBar>
      <Drawer
        variant="permanent"
        anchor="left"
        className={classes.drawer}
        classes={{ paper: classes.drawerPaper }}
      >
        <div>
          <Typography variant="h5" className={classes.title}>
            ANIMEWORLD-Z
          </Typography>
        </div>
        <List>
          {menuItems.map((menu, i) => (
            <ListItem
              key={i}
              button
              onClick={() => history.push(menu.path)}
              className={
                location.pathname === menu.path ? classes.active : null
              }
            >
              <ListItemIcon>{menu.icon}</ListItemIcon>
              <ListItemText primary={menu.text} />
            </ListItem>
          ))}
        </List>
        <div className={classes.footer}>
          <Typography variant="h6">v2.0.0</Typography>
        </div>
      </Drawer>
      <div className={classes.page}>
        <div className={classes.toolbar}></div>
        {children}
      </div>
    </div>
  );
}

export default Layout;
