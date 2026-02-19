# BharatViz R Client
# Generate India choropleth maps using the BharatViz API
#
# Author: Saket Choudhary <saketc@iitb.ac.in>
# License: MIT

library(httr)
library(jsonlite)
library(base64enc)

#' BharatViz R6 Class
#'
#' Client for interacting with the BharatViz API
#'
#' @export
BharatViz <- R6::R6Class(
  "BharatViz",

  public = list(
    #' @field api_url Base URL of the BharatViz API
    api_url = NULL,

    #' @description Create a new BharatViz client
    #' @param api_url API base URL (default: "https://bharatviz.saketlab.org")
    initialize = function(api_url = "https://bharatviz.saketlab.org") {
      self$api_url <- sub("/$", "", api_url)
      message("BharatViz client initialized")
      message("API URL: ", self$api_url)
    },

    #' @description Generate a state-level choropleth map
    #' @param data Data frame with 'state' and 'value' columns, or named list
    #' @param title Map title
    #' @param legend_title Legend label
    #' @param color_scale Color scale name
    #' @param invert_colors Invert color scale
    #' @param hide_state_names Hide state labels
    #' @param hide_values Hide value labels
    #' @param formats Export formats (default: "png")
    #' @return List with image data and metadata
    generate_map = function(data,
                           title = "BharatViz",
                           legend_title = "Values",
                           color_scale = "spectral",
                           invert_colors = FALSE,
                           hide_state_names = FALSE,
                           hide_values = FALSE,
                           formats = "png") {

      # Convert data to required format
      if (is.data.frame(data)) {
        data_list <- private$df_to_list(data)
      } else if (is.list(data) && !is.null(names(data))) {
        # Named list (state -> value)
        data_list <- private$dict_to_list(data)
      } else {
        data_list <- data
      }

      # Prepare request body
      body <- list(
        data = data_list,
        mainTitle = title,
        legendTitle = legend_title,
        colorScale = color_scale,
        invertColors = invert_colors,
        hideStateNames = hide_state_names,
        hideValues = hide_values,
        formats = as.list(formats)
      )

      # Make API request
      response <- POST(
        url = paste0(self$api_url, "/api/v1/states/map"),
        body = body,
        encode = "json",
        content_type_json()
      )

      # Check response
      if (status_code(response) != 200) {
        stop("API request failed: ", content(response, "text"))
      }

      result <- content(response, "parsed")

      if (!result$success) {
        stop("Map generation failed: ", result$error$message)
      }

      return(result)
    },

    #' @description Generate a district-level choropleth map
    #' @param data Data frame with 'state', 'district', and 'value' columns
    #' @param map_type District boundary type: "LGD", "NFHS5", or "NFHS4"
    #' @param title Map title
    #' @param legend_title Legend label
    #' @param color_scale Color scale name
    #' @param show_state_boundaries Show state boundaries overlay
    #' @param invert_colors Invert color scale
    #' @param hide_district_names Hide district name labels
    #' @param hide_values Hide value labels
    #' @param state Optional state name to filter and zoom to a single state
    #' @param formats Export formats (default: "png")
    #' @return List with image data and metadata
    generate_districts_map = function(data,
                                     map_type = "LGD",
                                     title = "BharatViz",
                                     legend_title = "Values",
                                     color_scale = "spectral",
                                     show_state_boundaries = TRUE,
                                     invert_colors = FALSE,
                                     hide_district_names = TRUE,
                                     hide_values = TRUE,
                                     state = NULL,
                                     formats = "png") {

      # Convert data to required format
      if (is.data.frame(data)) {
        data_list <- private$df_districts_to_list(data)
      } else {
        data_list <- data
      }

      # Prepare request body
      body <- list(
        data = data_list,
        mapType = map_type,
        mainTitle = title,
        legendTitle = legend_title,
        colorScale = color_scale,
        showStateBoundaries = show_state_boundaries,
        invertColors = invert_colors,
        hideDistrictNames = hide_district_names,
        hideValues = hide_values,
        formats = as.list(formats)
      )

      # Add optional state filter
      if (!is.null(state)) {
        body$state <- state
      }

      # Make API request
      response <- POST(
        url = paste0(self$api_url, "/api/v1/districts/map"),
        body = body,
        encode = "json",
        content_type_json()
      )

      # Check response
      if (status_code(response) != 200) {
        stop("API request failed: ", content(response, "text"))
      }

      result <- content(response, "parsed")

      if (!result$success) {
        stop("Map generation failed: ", result$error$message)
      }

      return(result)
    },

    #' @description Display a map in R graphics device
    #' @param result Result from generate_map() or generate_districts_map()
    #' @param format Format to display (default: "png")
    show_map = function(result, format = "png") {
      # Find the requested format
      export <- NULL
      for (exp in result$exports) {
        if (exp$format == format) {
          export <- exp
          break
        }
      }

      if (is.null(export)) {
        stop("Format '", format, "' not found in exports")
      }

      # Decode base64 image
      img_data <- base64decode(export$data)

      # Save to temp file and display
      temp_file <- tempfile(fileext = paste0(".", format))
      writeBin(img_data, temp_file)

      # Display using appropriate method
      if (format == "png") {
        library(png)
        img <- readPNG(temp_file)
        grid::grid.raster(img)
      } else if (format == "pdf") {
        message("PDF saved to: ", temp_file)
        message("Open with: system(paste('open', '", temp_file, "'))")
      }

      invisible(temp_file)
    },

    #' @description Save map to file
    #' @param result Result from generate_map() or generate_districts_map()
    #' @param filename Output filename
    #' @param format Format to save (default: "png")
    save_map = function(result, filename, format = "png") {
      # Find the requested format
      export <- NULL
      for (exp in result$exports) {
        if (exp$format == format) {
          export <- exp
          break
        }
      }

      if (is.null(export)) {
        stop("Format '", format, "' not found in exports")
      }

      # Decode base64 image
      img_data <- base64decode(export$data)

      # Write to file
      writeBin(img_data, filename)

      file_size <- file.info(filename)$size / 1024
      message(sprintf("Saved %s (%.2f KB)", filename, file_size))

      invisible(filename)
    },

    #' @description Get a raster grob from map result for use with grid/gridExtra
    #' @param result Result from generate_map() or generate_districts_map()
    #' @param format Format to use (default: "png")
    #' @return A rasterGrob object suitable for grid.arrange()
    get_grob = function(result, format = "png") {
      # Find the requested format
      export <- NULL
      for (exp in result$exports) {
        if (exp$format == format) {
          export <- exp
          break
        }
      }

      if (is.null(export)) {
        stop("Format '", format, "' not found in exports")
      }

      # Decode base64 image
      img_data <- base64decode(export$data)

      # Save to temp file and read as raster
      temp_file <- tempfile(fileext = paste0(".", format))
      writeBin(img_data, temp_file)

      if (format == "png") {
        library(png)
        img <- readPNG(temp_file)
        grob <- grid::rasterGrob(img, interpolate = TRUE)
        return(grob)
      } else {
        stop("get_grob() only supports PNG format")
      }
    },

    #' @description Save all available formats
    #' @param result Result from generate_map() or generate_districts_map()
    #' @param basename Base filename (without extension)
    save_all = function(result, basename) {
      saved_files <- list()

      for (export in result$exports) {
        filename <- paste0(basename, ".", export$format)
        img_data <- base64decode(export$data)
        writeBin(img_data, filename)

        file_size <- file.info(filename)$size / 1024
        message(sprintf("Saved %s (%.2f KB)", filename, file_size))

        saved_files[[export$format]] <- filename
      }

      invisible(saved_files)
    },

    #' @description Save all formats (PNG, SVG, PDF) from data
    #' @param data Data for map generation
    #' @param basename Base filename (without extension)
    #' @param ... Additional parameters passed to generate_map()
    save_all_formats = function(data, basename, ...) {
      result <- self$generate_map(
        data = data,
        formats = c("png", "svg", "pdf"),
        ...
      )

      self$save_all(result, basename)

      invisible(result)
    }
  ),

  private = list(
    # Convert data frame to list format for API
    df_to_list = function(df) {
      # Detect column names
      state_col <- private$find_column(df, c("state", "state_name", "State"))
      value_col <- private$find_column(df, c("value", "val", "Value"))

      # If columns not found, assume first column is state, second is value
      if (is.null(state_col) || is.null(value_col)) {
        if (ncol(df) >= 2) {
          state_col <- names(df)[1]
          value_col <- names(df)[2]
          message("Assuming first column '", state_col, "' is state and second column '", value_col, "' is value")
        } else {
          stop("Could not find 'state' and 'value' columns in data frame")
        }
      }

      # Convert to list
      data_list <- lapply(1:nrow(df), function(i) {
        list(
          state = as.character(df[[state_col]][i]),
          value = as.numeric(df[[value_col]][i])
        )
      })

      return(data_list)
    },

    # Convert data frame to districts list format
    df_districts_to_list = function(df) {
      # Detect column names
      state_col <- private$find_column(df, c("state", "state_name", "State"))
      district_col <- private$find_column(df, c("district", "district_name", "District"))
      value_col <- private$find_column(df, c("value", "val", "Value"))

      # If columns not found, assume first 3 columns are state, district, value
      if (is.null(state_col) || is.null(district_col) || is.null(value_col)) {
        if (ncol(df) >= 3) {
          state_col <- names(df)[1]
          district_col <- names(df)[2]
          value_col <- names(df)[3]
          message("Assuming first column '", state_col, "' is state, second column '", district_col, "' is district, and third column '", value_col, "' is value")
        } else {
          stop("Could not find 'state', 'district', and 'value' columns")
        }
      }

      # Convert to list
      data_list <- lapply(1:nrow(df), function(i) {
        list(
          state = as.character(df[[state_col]][i]),
          district = as.character(df[[district_col]][i]),
          value = as.numeric(df[[value_col]][i])
        )
      })

      return(data_list)
    },

    # Convert named list to API format
    dict_to_list = function(dict) {
      states <- names(dict)
      values <- unlist(dict)

      data_list <- lapply(1:length(states), function(i) {
        list(
          state = states[i],
          value = as.numeric(values[i])
        )
      })

      return(data_list)
    },

    # Find column by possible names
    find_column = function(df, possible_names) {
      for (name in possible_names) {
        if (name %in% names(df)) {
          return(name)
        }
      }
      return(NULL)
    }
  )
)

#' Convert named list to BharatViz data format
#'
#' @param dict Named list where names are states and values are numeric
#' @return List formatted for BharatViz API
#' @export
from_dict <- function(dict) {
  states <- names(dict)
  values <- unlist(dict)

  data_list <- lapply(seq_along(states), function(i) {
    list(
      state = states[i],
      value = as.numeric(values[i])
    )
  })

  return(data_list)
}

#' Convert data frame to BharatViz format
#'
#' @param df Data frame with state and value columns
#' @param state_col Name of state column (default: auto-detect)
#' @param value_col Name of value column (default: auto-detect)
#' @return List formatted for BharatViz API
#' @export
from_dataframe <- function(df, state_col = NULL, value_col = NULL) {
  # Auto-detect columns if not specified
  if (is.null(state_col)) {
    state_col <- find_column(df, c("state", "state_name", "State"))
  }
  if (is.null(value_col)) {
    value_col <- find_column(df, c("value", "val", "Value"))
  }

  if (is.null(state_col) || is.null(value_col)) {
    stop("Could not find 'state' and 'value' columns in data frame")
  }

  data_list <- lapply(seq_len(nrow(df)), function(i) {
    list(
      state = as.character(df[[state_col]][i]),
      value = as.numeric(df[[value_col]][i])
    )
  })

  return(data_list)
}

#' Convert data frame to BharatViz districts format
#'
#' @param df Data frame with state, district, and value columns
#' @param state_col Name of state column (default: auto-detect)
#' @param district_col Name of district column (default: auto-detect)
#' @param value_col Name of value column (default: auto-detect)
#' @return List formatted for BharatViz API
#' @export
from_dataframe_districts <- function(df, state_col = NULL, district_col = NULL, value_col = NULL) {
  # Auto-detect columns if not specified
  if (is.null(state_col)) {
    state_col <- find_column(df, c("state", "state_name", "State"))
  }
  if (is.null(district_col)) {
    district_col <- find_column(df, c("district", "district_name", "District"))
  }
  if (is.null(value_col)) {
    value_col <- find_column(df, c("value", "val", "Value"))
  }

  if (is.null(state_col) || is.null(district_col) || is.null(value_col)) {
    stop("Could not find 'state', 'district', and 'value' columns")
  }

  data_list <- lapply(seq_len(nrow(df)), function(i) {
    list(
      state = as.character(df[[state_col]][i]),
      district = as.character(df[[district_col]][i]),
      value = as.numeric(df[[value_col]][i])
    )
  })

  return(data_list)
}

#' Find column by possible names (internal helper)
#'
#' @param df Data frame
#' @param possible_names Vector of possible column names
#' @return Column name if found, NULL otherwise
find_column <- function(df, possible_names) {
  for (name in possible_names) {
    if (name %in% names(df)) {
      return(name)
    }
  }
  return(NULL)
}

#' Save all formats from BharatViz result
#'
#' @param bv BharatViz client instance
#' @param data Data for map generation
#' @param basename Base filename (without extension)
#' @param ... Additional parameters passed to generate_map()
#' @export
save_all_formats <- function(bv, data, basename, ...) {
  result <- bv$generate_map(
    data = data,
    formats = c("png", "svg", "pdf"),
    ...
  )

  bv$save_all(result, basename)

  invisible(result)
}

#' Save all formats for districts map
#'
#' @param bv BharatViz client instance
#' @param data Data for map generation
#' @param basename Base filename (without extension)
#' @param ... Additional parameters passed to generate_districts_map()
#' @export
save_all_formats_districts <- function(bv, data, basename, ...) {
  result <- bv$generate_districts_map(
    data = data,
    formats = c("png", "svg", "pdf"),
    ...
  )

  bv$save_all(result, basename)

  invisible(result)
}

#' Compare multiple color scales side by side
#'
#' @param bv BharatViz client instance
#' @param data Input data
#' @param scales Vector of color scale names to compare
#' @param title_prefix Prefix for map titles
#' @export
compare_scales <- function(bv, data, scales, title_prefix = "Sample") {
  results <- list()

  for (scale in scales) {
    cat("Generating map with", scale, "scale...\n")
    result <- bv$generate_map(
      data = data,
      title = paste(title_prefix, "-", scale),
      color_scale = scale,
      formats = "png"
    )

    bv$show_map(result)
    results[[scale]] <- result
  }

  invisible(results)
}

#' Quick map generation (convenience function)
#'
#' @param data Data frame or named list
#' @param title Map title
#' @param legend_title Legend label
#' @param color_scale Color scale
#' @param display Display the map (default: TRUE)
#' @param save_path Optional path to save PNG
#' @return Result from API
#' @export
quick_map <- function(data,
                     title = "BharatViz",
                     legend_title = "Values",
                     color_scale = "spectral",
                     display = TRUE,
                     save_path = NULL) {

  bv <- BharatViz$new()
  result <- bv$generate_map(
    data = data,
    title = title,
    legend_title = legend_title,
    color_scale = color_scale
  )

  if (display) {
    bv$show_map(result)
  }

  if (!is.null(save_path)) {
    bv$save_map(result, save_path)
  }

  invisible(result)
}

#' Quick districts map generation (convenience function)
#'
#' @param data Data frame with state, district, value columns
#' @param map_type District boundary type ("LGD", "NFHS5", "NFHS4")
#' @param title Map title
#' @param legend_title Legend label
#' @param color_scale Color scale
#' @param hide_district_names Hide district name labels
#' @param hide_values Hide value labels
#' @param state Optional state name to filter and zoom to a single state
#' @param display Display the map (default: TRUE)
#' @param save_path Optional path to save PNG
#' @return Result from API
#' @export
quick_districts_map <- function(data,
                               map_type = "LGD",
                               title = "BharatViz",
                               legend_title = "Values",
                               color_scale = "spectral",
                               hide_district_names = TRUE,
                               hide_values = TRUE,
                               state = NULL,
                               display = TRUE,
                               save_path = NULL) {

  bv <- BharatViz$new()
  result <- bv$generate_districts_map(
    data = data,
    map_type = map_type,
    title = title,
    legend_title = legend_title,
    color_scale = color_scale,
    hide_district_names = hide_district_names,
    hide_values = hide_values,
    state = state
  )

  if (display) {
    bv$show_map(result)
  }

  if (!is.null(save_path)) {
    bv$save_map(result, save_path)
  }

  invisible(result)
}

# Available color scales
COLOR_SCALES <- list(
  sequential = c("blues", "greens", "reds", "oranges", "purples", "pinks",
                "viridis", "plasma", "inferno", "magma"),
  diverging = c("spectral", "rdylbu", "rdylgn", "brbg", "piyg", "puor")
)
