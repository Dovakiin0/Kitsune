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
  CssBaseline,
  Divider,
  Hidden,
  IconButton,
} from "@material-ui/core";
import { makeStyles, alpha, useTheme } from "@material-ui/core/styles";
import {
  HomeRounded,
  ImageRounded,
  SearchOutlined,
  MenuBookRounded,
} from "@material-ui/icons";
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
    drawer: {
      [theme.breakpoints.up("sm")]: {
        width: drawerWidth,
        flexShrink: 0,
      },
    },
    appBar: {
      [theme.breakpoints.up("sm")]: {
        width: `calc(100% - ${drawerWidth}px)`,
        marginLeft: drawerWidth,
      },
    },
    menuButton: {
      marginRight: theme.spacing(2),
      [theme.breakpoints.up("sm")]: {
        display: "none",
      },
    },
    // necessary for content to be below app bar
    toolbar: theme.mixins.toolbar,
    drawerPaper: {
      width: drawerWidth,
    },
    content: {
      flexGrow: 1,
      padding: theme.spacing(3),
    },
    page: {
      [theme.breakpoints.down("xs")]: {
        width: `100%`,
      },
      width: `calc(100% - ${drawerWidth}px)`,
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
    time: {
      flexGrow: 1,
      [theme.breakpoints.down("xs")]: {
        display: "none",
      },
    },
    footer: {
      position: "absolute",
      bottom: 0,
      left: "40%",
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

function Layout({ window, children }) {
  const theme = useTheme();
  const classes = useStyles();
  const history = useHistory();
  const location = useLocation();
  const [searchResult, setSearchResult] = useState([]);
  const [time, setTime] = useState(new Date().toLocaleTimeString());
  const { darkMode, setDarkMode } = useContext(DarkModeContext);
  const [keyword, setKeyword] = useState("");
  const [mobileOpen, setMobileOpen] = React.useState(false);

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

  const drawer = (
    <div>
      <div>
        <Typography variant="h5" className={classes.title}>
          ANIMEWORLD-Z
        </Typography>
      </div>
      <Divider />
      <List>
        {menuItems.map((menu, i) => (
          <ListItem
            key={i}
            button
            onClick={() => history.push(menu.path)}
            className={location.pathname === menu.path ? classes.active : null}
          >
            <ListItemIcon>{menu.icon}</ListItemIcon>
            <ListItemText primary={menu.text} />
          </ListItem>
        ))}
      </List>
      <div className={classes.footer}>
        <Typography variant="h6" className={classes.version}>
          v2.1
        </Typography>
      </div>
    </div>
  );

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

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleResetKeyword = () => {
    setKeyword("");
  };

  useEffect(() => {
    let timer = setTimeout(() => getSearchAnime(), 1000);
    return () => clearTimeout(timer);
  }, [keyword]);

  const container =
    window !== undefined ? () => window().document.body : undefined;

  return (
    <div className={classes.root}>
      <CssBaseline />
      {keyword !== "" ? (
        <SearchList
          results={searchResult}
          handleResetKeyword={handleResetKeyword}
        />
      ) : (
        ""
      )}
      <AppBar className={classes.appBar} color="dafault">
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            className={classes.menuButton}
          >
            <MenuBookRounded />
          </IconButton>
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
      <nav className={classes.drawer}>
        {/* The implementation can be swapped with js to avoid SEO duplication of links. */}
        <Hidden smUp implementation="css">
          <Drawer
            container={container}
            variant="temporary"
            anchor={theme.direction === "rtl" ? "right" : "left"}
            open={mobileOpen}
            onClose={handleDrawerToggle}
            classes={{
              paper: classes.drawerPaper,
            }}
            ModalProps={{
              keepMounted: true, // Better open performance on mobile.
            }}
          >
            {drawer}
          </Drawer>
        </Hidden>
        <Hidden xsDown implementation="css">
          <Drawer
            classes={{
              paper: classes.drawerPaper,
            }}
            variant="permanent"
            open
          >
            {drawer}
          </Drawer>
        </Hidden>
      </nav>
      <div className={classes.page}>
        <div className={classes.toolbar}></div>
        {children}
      </div>
    </div>
  );
}

export default Layout;
