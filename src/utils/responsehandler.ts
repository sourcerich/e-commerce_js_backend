// Standard response envelope used by every endpoint so the API is predictable
// to consume: { status, status_code, code, message, data }.
export const errorMessageHandle = (message: any, error?: any) => {
  if (error) console.log("ERROR:", message, error);
  return {
    status: false,
    status_code: 500,
    code: "FAILED",
    message,
  };
};

export const successDataHandle = (data: any, message = "success") => ({
  status: true,
  status_code: 200,
  code: "SUCCESS",
  message,
  data,
});

export const successMessageHandle = (message: string) => ({
  status: true,
  status_code: 200,
  code: "SUCCESS",
  message,
});
