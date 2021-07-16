import React from "react";
import { Button, CircularProgress } from "@material-ui/core";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";
import useMediaQuery from "@material-ui/core/useMediaQuery";
import { useTheme } from "@material-ui/core/styles";

export default function ModalAnime({
  isOpen,
  handleWatchClick,
  handleClose,
  data,
}) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <div>
      {data ? (
        <Dialog
          fullScreen={fullScreen}
          open={isOpen}
          onClose={handleClose}
          aria-labelledby="responsive-dialog-title"
          PaperProps={{
            style: {
              backgroundImage: `linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.6) 70%, rgba(0,0,0,0.3) 100%),url(${data.img})`,
              backgroundRepeat: "no-repeat",
              backgroundSize: "cover",
              color: "#e6e6e6",
            },
          }}
        >
          <DialogTitle id="responsive-dialog-title">{data.title}</DialogTitle>
          <DialogContent>
            <DialogContentText
              style={{ fontWeight: "bolder", color: "#e6e6e6" }}
            >
              Other Names: {data.other_name}
            </DialogContentText>
          </DialogContent>
          <DialogContent>
            <DialogContentText
              style={{ fontWeight: "bolder", color: "#e6e6e6" }}
            >
              Genres: {data.genre.join(", ")}
            </DialogContentText>
          </DialogContent>
          <DialogContent>
            <DialogContentText
              style={{ fontWeight: "bolder", color: "#e6e6e6" }}
            >
              Plot Summary :
            </DialogContentText>
            <DialogContentText
              style={{ fontWeight: "bolder", color: "#e6e6e6" }}
            >
              {data.plot_summary}
            </DialogContentText>
          </DialogContent>
          <DialogContent>
            <DialogContentText
              style={{ fontWeight: "bolder", color: "#e6e6e6" }}
            >
              Released: {data.released}
            </DialogContentText>
          </DialogContent>
          <DialogContent>
            <DialogContentText
              style={{ fontWeight: "bolder", color: "#e6e6e6" }}
            >
              Status: {data.status}
            </DialogContentText>
          </DialogContent>
          <DialogContent>
            <DialogContentText
              style={{ fontWeight: "bolder", color: "#e6e6e6" }}
            >
              Episodes: {data.episode_count}
            </DialogContentText>
          </DialogContent>
          <DialogContent>
            <DialogContentText
              style={{ fontWeight: "bolder", color: "#e6e6e6" }}
            >
              Type: {data.type}
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button
              autoFocus
              variant="contained"
              onClick={() => handleWatchClick(data.slug)}
              color="default"
              fullWidth
            >
              Start Watching
            </Button>
          </DialogActions>
        </Dialog>
      ) : (
        <CircularProgress />
      )}
    </div>
  );
}
