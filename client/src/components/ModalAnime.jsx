import React from "react";
import { Button, CircularProgress } from "@material-ui/core";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";
import useMediaQuery from "@material-ui/core/useMediaQuery";
import { useTheme } from "@material-ui/core/styles";

export default function ModalAnime({ children, isOpen, handleClose, data }) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  console.log(data);

  return (
    <div>
      <Dialog
        fullScreen={fullScreen}
        open={isOpen}
        onClose={handleClose}
        aria-labelledby="responsive-dialog-title"
      >
        {data ? (
          <>
            <DialogTitle
              id="responsive-dialog-title"
              style={{ backgroundImage: `url(${data.img})` }}
            >
              {data.title}
            </DialogTitle>
            <DialogContent>
              <DialogContentText>
                Other Names: {data.other_name}
              </DialogContentText>
            </DialogContent>
            <DialogContent>
              <DialogContentText>Genres: {data.genre.join()}</DialogContentText>
            </DialogContent>
            <DialogContent>
              <DialogContentText>Plot Summary :</DialogContentText>
              <DialogContentText>{data.plot_summary}</DialogContentText>
            </DialogContent>
            <DialogContent>
              <DialogContentText>Released: {data.released}</DialogContentText>
            </DialogContent>

            <DialogContent>
              <DialogContentText>Status: {data.status}</DialogContentText>
            </DialogContent>
            <DialogContent>
              <DialogContentText>Type: {data.type}</DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button
                autoFocus
                variant="contained"
                onClick={handleClose}
                color="default"
                fullWidth
              >
                Watch Episode
              </Button>
            </DialogActions>
          </>
        ) : (
          <CircularProgress />
        )}
      </Dialog>
    </div>
  );
}
