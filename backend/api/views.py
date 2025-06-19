from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework import status

class HelloWorldView(APIView):
    """
    A simple API View that returns a Hello World message
    """
    permission_classes = [AllowAny]
    
    def get(self, request, *args, **kwargs):
        """
        Returns a Hello World message
        """
        return Response({
            "message": "Hello World!",
            "status": "success"
        }, status=status.HTTP_200_OK)
    
    def post(self, request, *args, **kwargs):
        """
        Accepts a message and returns it with a greeting
        """
        message = request.data.get('message', 'World')
        return Response({
            "message": f"Hello {message}!",
            "status": "success"
        }, status=status.HTTP_200_OK)
