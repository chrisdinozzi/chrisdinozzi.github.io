#key gen for RaphDev's PleaseCrackMe
#https://crackmes.one/crackme/612e85d833c5d41acedffa4f

def keygen(username,number):
        password=""
        for c in username:
            password = password+chr(ord(c)+int(number))        
        return password

username = input("Enter username: ")
print ("Username is: "+username)
number = input("Enter number: ")
print("Number is: " +number)
print("Password is: "+keygen(username,number))